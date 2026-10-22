import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
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

  // L'interface applique la même politique de statut que les règles Firestore.
  // Les profils historiques sans statut valide sont bloqués jusqu'à régularisation.
  const userStatus = userData.statut || (userData as typeof userData & { status?: string }).status;
  if (!['actif', 'a_jour'].includes(userStatus || '')) {
    const statusLabel = userStatus || 'non renseigné';
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
        <section className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Accès au tableau de bord indisponible</h1>
          <p className="mt-3 text-sm text-gray-600">
            Le statut de votre profil (« {statusLabel} ») ne permet pas l'accès. Contactez un responsable de l'association pour vérifier votre dossier.
          </p>
          <button
            type="button"
            onClick={() => { void signOut(auth).catch((error) => console.error('Erreur de déconnexion:', error)); }}
            className="mt-5 rounded-lg bg-blue-900 px-4 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Se déconnecter
          </button>
        </section>
      </main>
    );
  }

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
