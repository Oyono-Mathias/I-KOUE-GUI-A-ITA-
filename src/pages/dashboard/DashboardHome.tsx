import React, { lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';

// Chargement dynamique des tableaux de bord par rôle
const CommunicateurDashboard = lazy(() => import('../communication/CommunicateurDashboard').then(m => ({ default: m.CommunicateurDashboard })));
const PresidentDashboard = lazy(() => import('./PresidentDashboard').then(m => ({ default: m.PresidentDashboard })));
const VicePresidentDashboard = lazy(() => import('./VicePresidentDashboard').then(m => ({ default: m.VicePresidentDashboard })));
const SecretaireDashboard = lazy(() => import('./SecretaireDashboard').then(m => ({ default: m.SecretaireDashboard })));
const TresorierDashboard = lazy(() => import('./TresorierDashboard').then(m => ({ default: m.TresorierDashboard })));
const ConseillerDashboard = lazy(() => import('./ConseillerDashboard').then(m => ({ default: m.ConseillerDashboard })));
const MemberDashboard = lazy(() => import('./MemberDashboard').then(m => ({ default: m.MemberDashboard })));

const DashboardLoadingFallback = () => (
  <div role="status" aria-live="polite" className="min-h-[50vh] flex items-center justify-center text-bleu-rca font-bold">
    Chargement...
  </div>
);

// Les alias historiques sont normalisés vers la même vue que leur rôle canonique.
// Les rôles d'administration du bureau utilisent la vue de pilotage existante.
const PRESIDENT_ROLES = ['super_admin', 'president', 'president_fondateur', 'admin', 'admin_bureau'];

export const DashboardHome = () => {
  const { userData } = useAuth();
  const role = userData?.role ?? 'membre';

  let dashboard;
  switch (role) {
    case 'communicateur':
      dashboard = <CommunicateurDashboard />;
      break;
    case 'tresorier':
      dashboard = <TresorierDashboard />;
      break;
    case 'conseiller':
      dashboard = <ConseillerDashboard />;
      break;
    case 'vice_president':
      dashboard = <VicePresidentDashboard />;
      break;
    case 'secretaire':
      dashboard = <SecretaireDashboard />;
      break;
    default:
      dashboard = PRESIDENT_ROLES.includes(role)
        ? <PresidentDashboard />
        : <MemberDashboard />;
  }

  return <Suspense fallback={<DashboardLoadingFallback />}>{dashboard}</Suspense>;
};
