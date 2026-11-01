import React, { lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';

// Chargement dynamique (lazy loading) des tableaux de bord par rôle
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

export const DashboardHome = () => {
  const { userData } = useAuth();
  const rawRole = (userData as (typeof userData & { userRole?: string }) | null)?.role || (userData as (typeof userData & { userRole?: string }) | null)?.userRole || '';
  const role = rawRole === 'treasurer' ? 'tresorier' : ['member', 'adherent'].includes(rawRole) ? 'membre' : ['president', 'president_fondateur', 'admin', 'admin_bureau'].includes(rawRole) ? 'super_admin' : rawRole;
  
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      {(() => {
        if (role === 'communicateur') {
          return <CommunicateurDashboard />;
        }

        if (role === 'tresorier') {
          return <TresorierDashboard />;
        }

        if (role === 'conseiller') {
          return <ConseillerDashboard />;
        }

        if (role === 'super_admin') {
          return <PresidentDashboard />;
        }

        if (role === 'vice_president') {
          return <VicePresidentDashboard />;
        }

        if (role === 'secretaire') {
          return <SecretaireDashboard />;
        }
        
        if (role === 'membre') return <MemberDashboard />;
        return <div role="alert" className="p-8 text-center text-gray-600">Aucun tableau de bord n’est associé à ce rôle. Contactez un administrateur.</div>;
      })()}
    </Suspense>
  );
};
