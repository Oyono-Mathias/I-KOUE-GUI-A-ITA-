import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { DashboardSwitcher } from './DashboardSwitcher';

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
  const isSuper = ['super_admin', 'president', 'president_fondateur', 'admin'].includes(userRole);
  const path = location.pathname;

  // Contrôle d'accès RBAC strict sur chaque sous-route de tableau de bord
  if (path.includes('/super_admin') && !isSuper) {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_vice_president') && !isSuper && userRole !== 'vice_president') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_secretaire') && !isSuper && userRole !== 'secretaire') {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/admin_tresorier') || path.includes('/finances')) && !isSuper && userRole !== 'tresorier') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_conseiller') && !isSuper && userRole !== 'conseiller') {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/dashboard/communicateur') || path.includes('/dashboard/news')) && !isSuper && userRole !== 'communicateur') {
    return <Navigate to="/dashboard" replace />;
  }

  // Tous les tableaux de bord sont désormais des vues autonomes Mobile-First avec leur propre Header et Bottom Nav.
  return (
    <>
      <DashboardSwitcher />
      <Outlet />
    </>
  );
};
