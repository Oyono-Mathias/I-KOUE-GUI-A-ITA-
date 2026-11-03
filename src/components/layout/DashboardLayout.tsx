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
  const isSystemAdmin = ['super_admin', 'admin'].includes(userRole);
  const path = location.pathname;

  // Les administrateurs techniques peuvent consulter les vues de rôle sans usurper le rôle Firestore.
  // Chaque rôle institutionnel reste limité à sa propre route.
  if ((path.endsWith('/super_admin')) && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.endsWith('/president') && !isSystemAdmin && userRole !== 'president') return <Navigate to="/dashboard" replace />;
  if (path.endsWith('/president_fondateur') && !isSystemAdmin && userRole !== 'president_fondateur') return <Navigate to="/dashboard" replace />;
  if (path.includes('/admin_vice_president') && !isSystemAdmin && userRole !== 'vice_president') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_secretaire') && !isSystemAdmin && !['secretaire_general', 'secretaire'].includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/admin_tresorier') || path.includes('/finances')) && !isSystemAdmin && userRole !== 'tresorier') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.endsWith('/membre') && !isSystemAdmin && !['membre', 'member'].includes(userRole)) return <Navigate to="/dashboard" replace />;
  if (path.includes('/admin_conseiller') && !isSystemAdmin && userRole !== 'conseiller') {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/dashboard/communicateur') || path.includes('/dashboard/news')) && !isSystemAdmin && userRole !== 'communicateur') {
    return <Navigate to="/dashboard" replace />;
  }

  const canManageLanding = isSystemAdmin || ['communicateur', 'president', 'president_fondateur'].includes(userRole);
  if (path === '/dashboard/landing-cms' && !canManageLanding) return <Navigate to="/dashboard" replace />;
  const usesDashboardSidebarTools = path === '/dashboard' && ['president', 'president_fondateur', 'super_admin', 'admin'].includes(userRole);

  // Tous les tableaux de bord sont des vues autonomes Mobile-First.
  return (
    <>
      {!usesDashboardSidebarTools && <DashboardSwitcher />}
      <Outlet />
    </>
  );
};
