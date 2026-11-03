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
  // Les dirigeants peuvent consulter les espaces exécutifs depuis le sélecteur.
  // Les permissions réelles restent appliquées par les règles Firestore.
  const canSuperviseDashboards = ['president', 'president_fondateur', 'super_admin', 'admin'].includes(userRole);
  const path = location.pathname;

  // Les rôles institutionnels n'héritent jamais des droits d'administration technique.
  if (['/dashboard/president', '/dashboard/president_fondateur'].includes(path) && !canSuperviseDashboards) {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/super_admin') && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_vice_president') && !canSuperviseDashboards && userRole !== 'vice_president') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_secretaire') && !canSuperviseDashboards && !['secretaire_general', 'secretaire'].includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/admin_tresorier') || path.includes('/finances')) && !canSuperviseDashboards && userRole !== 'tresorier') {
    return <Navigate to="/dashboard" replace />;
  }
  if (path.includes('/admin_conseiller') && !canSuperviseDashboards && userRole !== 'conseiller') {
    return <Navigate to="/dashboard" replace />;
  }
  if ((path.includes('/dashboard/communicateur') || path.includes('/dashboard/news')) && !canSuperviseDashboards && userRole !== 'communicateur') {
    return <Navigate to="/dashboard" replace />;
  }

  const canManageLanding = isSystemAdmin || ['communicateur', 'president', 'president_fondateur'].includes(userRole);
  if (path === '/dashboard/landing-cms' && !canManageLanding) return <Navigate to="/dashboard" replace />;
  const usesDashboardSidebarTools = (
    ['/dashboard', '/dashboard/president'].includes(path) && ['president', 'super_admin', 'admin'].includes(userRole)
  ) || (path === '/dashboard/president_fondateur' && canSuperviseDashboards);

  // Tous les tableaux de bord sont des vues autonomes Mobile-First.
  return (
    <>
      {!usesDashboardSidebarTools && <DashboardSwitcher />}
      <Outlet />
    </>
  );
};
