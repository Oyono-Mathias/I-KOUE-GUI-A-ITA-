import React, { lazy, Suspense } from 'react';
import { useAuth } from '../../hooks/useAuth';

// Chaque rôle reconnu est traité explicitement : aucun rôle inconnu ne reçoit
// silencieusement les droits ou l'interface d'un membre.
const CommunicateurDashboard = lazy(() => import('../communication/CommunicateurDashboard').then(m => ({ default: m.CommunicateurDashboard })));
const PresidentDashboard = lazy(() => import('./PresidentDashboard').then(m => ({ default: m.PresidentDashboard })));
const PresidentFondateurDashboard = lazy(() => import('./PresidentFondateurDashboard').then(m => ({ default: m.PresidentFondateurDashboard })));
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

const RoleAccessFallback = ({ message }: { message: string }) => (
  <section role="alert" className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-6 text-center">
    <h2 className="text-xl font-bold">Accès au tableau de bord indisponible</h2>
    <p>{message}</p>
    <p>Veuillez contacter un administrateur pour vérifier votre profil et vos autorisations.</p>
  </section>
);

export const DashboardHome = () => {
  const { userData, loading } = useAuth();

  if (loading) {
    return <DashboardLoadingFallback />;
  }

  if (!userData) {
    return <RoleAccessFallback message="Votre profil utilisateur n'a pas pu être chargé." />;
  }

  let dashboard: React.ReactNode;
  switch (userData.role) {
    case 'super_admin':
    case 'president':
    case 'admin':
    case 'admin_bureau':
      dashboard = <PresidentDashboard />;
      break;
    case 'president_fondateur':
      dashboard = <PresidentFondateurDashboard />;
      break;
    case 'vice_president':
      dashboard = <VicePresidentDashboard />;
      break;
    case 'secretaire_general':
    case 'secretaire':
      dashboard = <SecretaireDashboard />;
      break;
    case 'tresorier':
      dashboard = <TresorierDashboard />;
      break;
    case 'conseiller':
      dashboard = <ConseillerDashboard />;
      break;
    case 'communicateur':
      dashboard = <CommunicateurDashboard />;
      break;
    case 'membre':
      dashboard = <MemberDashboard />;
      break;
    case 'secretaire_adjoint':
    case 'tresorier_adjoint':
    case 'commissaire_aux_comptes':
      dashboard = <RoleAccessFallback message={`Votre profil « ${String(userData.role)} » est reconnu. Son espace dédié sera activé après validation de ses permissions spécifiques.`} />;
      break;
    default:
      dashboard = <RoleAccessFallback message={`Le rôle « ${String(userData.role)} » n'est pas reconnu par l'application.`} />;
      break;
  }

  return <Suspense fallback={<DashboardLoadingFallback />}>{dashboard}</Suspense>;
};
