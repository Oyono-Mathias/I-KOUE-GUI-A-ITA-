import React, { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../firebase';
import { DashboardHeader } from '../../components/layout/DashboardHeader';
import { DashboardSidebar } from '../../components/layout/DashboardSidebar';
import { DashboardBottomNavigation } from '../../components/layout/DashboardBottomNavigation';
import { DashboardSwitcher } from '../../components/layout/DashboardSwitcher';
import '../../components/layout/dashboard-navigation.css';

/** Espace honorifique : aucun outil opérationnel ou financier n'est exposé. */
export const PresidentFondateurDashboard: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const userName = userData?.displayName || userData?.nom || 'Président-Fondateur';

  const closeSidebar = () => setShowMobileSidebar(false);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Erreur de déconnexion :', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userName={userName}
        roleLabel="Président-Fondateur"
        notificationCount={0}
        menuOpen={showMobileSidebar}
        onMenuToggle={() => setShowMobileSidebar(open => !open)}
        onNotificationsClick={() => setShowMobileSidebar(true)}
      />
      <DashboardSidebar
        open={showMobileSidebar}
        activeSection="dashboard"
        userName={userName}
        roleLabel="Président-Fondateur"
        onNavigate={closeSidebar}
        onLogout={handleLogout}
        onClose={closeSidebar}
        items={[{ id: 'dashboard', label: 'Accueil', icon: LayoutDashboard }]}
        footerActions={(
          <div className="px-1 pb-3">
            <DashboardSwitcher inline />
          </div>
        )}
      />
      <DashboardBottomNavigation
        activeSection="dashboard"
        onNavigate={closeSidebar}
        onMenuClick={() => setShowMobileSidebar(true)}
        items={[{ id: 'dashboard', label: 'Accueil', icon: LayoutDashboard }]}
      />

      <main className="min-h-screen px-4 pb-24 pt-20 md:p-8">
        <section className="mx-auto max-w-4xl space-y-6">
          <header className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
              Fonction honorifique et stratégique
            </span>
            <h1 className="mt-3 text-2xl font-bold text-[#0A3D62]">Espace du Président Fondateur</h1>
            <p className="mt-2 text-gray-600">
              Bienvenue {userName}. Cet espace est dédié à la mémoire,
              à la vision et à la transmission institutionnelles de l'association.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#0A3D62]">Mémoire institutionnelle</h2>
              <p className="mt-2 text-sm text-gray-600">
                Consultation des repères historiques, décisions fondatrices et archives
                institutionnelles, selon les accès qui seront définis.
              </p>
            </article>
            <article className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-[#0A3D62]">Orientation stratégique</h2>
              <p className="mt-2 text-sm text-gray-600">
                Réflexion et transmission de la vision fondatrice, sans pouvoir d'exécution
                ni validation administrative ou financière.
              </p>
            </article>
          </div>
          <p className="text-sm text-gray-500">
            Les outils opérationnels et les données financières ne sont pas accessibles depuis
            ce tableau de bord.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PresidentFondateurDashboard;
