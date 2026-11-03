import React from 'react';
import { useAuth } from '../../hooks/useAuth';

/** Espace honorifique : aucun outil opérationnel ou financier n'est exposé. */
export const PresidentFondateurDashboard: React.FC = () => {
  const { userData } = useAuth();

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
            Fonction honorifique et stratégique
          </span>
          <h1 className="mt-3 text-2xl font-bold text-[#0A3D62]">Espace du Président Fondateur</h1>
          <p className="mt-2 text-gray-600">
            Bienvenue {userData?.displayName || ''}. Cet espace est dédié à la mémoire,
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
  );
};

export default PresidentFondateurDashboard;
