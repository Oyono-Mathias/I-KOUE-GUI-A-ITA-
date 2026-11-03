import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { createOrdinaryMember } from '../../services/memberCreation';

/** Espace honorifique : aucun outil opérationnel ou financier n'est exposé. */
export const PresidentFondateurDashboard: React.FC = () => {
  const { userData } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const submitMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setCreating(true);
    try {
      await createOrdinaryMember({
        nom: String(data.get('nom') || ''),
        email: String(data.get('email') || ''),
        password: String(data.get('password') || ''),
        telephone: String(data.get('telephone') || ''),
        categorie: String(data.get('categorie') || 'actif') as 'actif' | 'bienfaiteur' | 'fondateur',
      });
      form.reset();
      setCreateOpen(false);
      alert('Compte membre créé avec succès.');
    } catch (error: any) {
      alert(error?.message || 'La création du membre a échoué.');
    } finally {
      setCreating(false);
    }
  };

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
        <button type="button" onClick={() => setCreateOpen(true)} className="rounded-lg bg-[#0A3D62] px-4 py-3 font-semibold text-white">Créer un membre ordinaire</button>
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
        {createOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={submitMember} className="w-full max-w-lg space-y-3 rounded-xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold">Nouveau membre</h2><label className="block text-sm">Nom complet<input name="nom" required maxLength={120} className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">Adresse e-mail<input name="email" type="email" required className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">Mot de passe temporaire<input name="password" type="password" minLength={6} maxLength={128} autoComplete="new-password" required className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">Téléphone<input name="telephone" maxLength={40} className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">Rôle<input value="Membre" readOnly disabled className="mt-1 w-full rounded border bg-gray-100 p-2" /></label><label className="block text-sm">Catégorie<select name="categorie" className="mt-1 w-full rounded border p-2"><option value="actif">Actif</option><option value="bienfaiteur">Bienfaiteur</option><option value="fondateur">Fondateur</option></select></label><div className="flex justify-end gap-2"><button type="button" disabled={creating} onClick={() => setCreateOpen(false)} className="rounded border px-4 py-2">Annuler</button><button type="submit" disabled={creating} className="rounded bg-[#0A3D62] px-4 py-2 text-white disabled:opacity-60">{creating ? 'Création...' : 'Créer le membre'}</button></div></form></div>}
        <p className="text-sm text-gray-500">
          Les outils opérationnels et les données financières ne sont pas accessibles depuis
          ce tableau de bord.
        </p>
      </section>
    </main>
  );
};

export default PresidentFondateurDashboard;
