import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DashboardSwitcher } from './DashboardSwitcher';
import { Link } from 'react-router-dom';

export const DashboardLayout = () => {
  const { userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center text-bleu-rca font-bold">
        Chargement sécurisé...
      </div>
    );
  }

  if (!userData) return <Navigate to="/login" replace />;

  const userRole = userData.role || 'membre';
  const isSystemAdmin = ['super_admin', 'admin'].includes(userRole);
  const path = location.pathname;

  // Les rôles institutionnels n'héritent jamais des droits d'administration technique.
  if (path.includes('/super_admin') && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_vice_president') && !isSystemAdmin && userRole !== 'vice_president') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_secretaire') && !isSystemAdmin && !['secretaire_general', 'secretaire'].includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/admin_tresorier') || path.includes('/finances')) && !isSystemAdmin && userRole !== 'tresorier') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_conseiller') && !isSystemAdmin && userRole !== 'conseiller') {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/dashboard/communicateur') || path.includes('/dashboard/news')) && !isSystemAdmin && userRole !== 'communicateur') {
    return <Navigate to="/dashboard" replace />;
  }

  const canManageLanding = isSystemAdmin || ['communicateur', 'president', 'president_fondateur'].includes(userRole);

  // Tous les tableaux de bord sont des vues autonomes Mobile-First.
  return (
    <>
      {canManageLanding && (
        <Link to="/dashboard/landing-cms" className="fixed bottom-20 right-4 z-[900] rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-slate-700">
          Gérer le site public
        </Link>
      )}
      <DashboardSwitcher />
      <Outlet />
    </>
  );
};
