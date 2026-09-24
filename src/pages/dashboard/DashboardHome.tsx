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
  
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      {(() => {
        if (userData?.role === 'communicateur') {
          return <CommunicateurDashboard />;
        }

        if (userData?.role === 'tresorier') {
          return <TresorierDashboard />;
        }

        if (userData?.role === 'conseiller') {
          return <ConseillerDashboard />;
        }

        if (userData?.role === 'super_admin') {
          return <PresidentDashboard />;
        }

        if (userData?.role === 'vice_president') {
          return <VicePresidentDashboard />;
        }

        if (userData?.role === 'secretaire') {
          return <SecretaireDashboard />;
        }
        
        return <MemberDashboard />;
      })()}
    </Suspense>
  );
};
