import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Pencil, Search, Users, X } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

type MemberRecord = {
  id: string;
  nom?: string;
  displayName?: string;
  email?: string;
  telephone?: string;
  categorie?: string;
  statut?: string;
  userId?: string;
  uid?: string;
  cotisationAnnuelle?: number;
  dernierPaiement?: any;
};

const SECRETARY_ROLES = ['secretaire_general', 'secretaire'];
const READ_ROLES = [
  ...SECRETARY_ROLES,
  'secretaire_adjoint',
  'tresorier',
  'tresorier_adjoint',
  'vice_president',
  'super_admin',
  'admin',
];

export const MemberManagement = () => {
  const navigate = useNavigate();
  const { userData, loading: authLoading } = useAuth();
  const role = userData?.role || '';
  const canRead = READ_ROLES.includes(role);
  const canEdit = SECRETARY_ROLES.includes(role) || ['super_admin', 'admin'].includes(role);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<MemberRecord | null>(null);
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', categorie: 'actif' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!canRead) return;
    const unsubscribe = onSnapshot(
      collection(db, 'members'),
      snapshot => {
        setMembers(snapshot.docs.map(item => ({ id: item.id, ...item.data() } as MemberRecord)));
        setLoadError('');
        setLoading(false);
      },
      error => {
        console.error('Chargement des fiches membres :', error);
        setLoadError(error.code === 'permission-denied'
          ? 'Votre rôle ne permet pas de consulter les fiches membres.'
          : 'Impossible de charger les fiches membres. Vérifiez la connexion puis réessayez.');
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [canRead]);

  const filteredMembers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fr');
    return members.filter(member => {
      const matchesSearch = !term || [
        member.nom, member.displayName, member.email, member.telephone,
      ].some(value => String(value || '').toLocaleLowerCase('fr').includes(term));
      const matchesFilter = filter === 'all'
        || (filter === 'actif' && member.categorie === 'actif')
        || (filter === 'bienfaiteur' && member.categorie === 'bienfaiteur')
        || (filter === 'fondateur' && member.categorie === 'fondateur')
        || (filter === 'a_jour' && member.statut === 'a_jour')
        || (filter === 'en_retard' && member.statut === 'en_retard');
      return matchesSearch && matchesFilter;
    });
  }, [members, search, filter]);

  const openEditor = (member: MemberRecord) => {
    setEditing(member);
    setForm({
      nom: member.nom || member.displayName || '',
      email: member.email || '',
      telephone: member.telephone || '',
      categorie: member.categorie || 'actif',
    });
    setSaveError('');
    setNotice('');
  };

  const saveMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || !canEdit || saving) return;
    if (!form.nom.trim()) {
      setSaveError('Le nom du membre est obligatoire.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await updateDoc(doc(db, 'members', editing.id), {
        nom: form.nom.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        categorie: form.categorie,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.uid || '',
      });
      setEditing(null);
      setNotice('La fiche du membre a été mise à jour.');
    } catch (error: any) {
      console.error('Modification de la fiche membre :', error);
      setSaveError(error?.code === 'permission-denied'
        ? 'Modification refusée par les règles de sécurité de votre rôle.'
        : 'La modification a échoué. Vérifiez votre connexion puis réessayez.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen grid place-items-center text-slate-600">Chargement sécurisé…</div>;
  if (!userData) return <Navigate to="/login" replace />;
  if (!canRead) return <Navigate to="/dashboard" replace />;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft size={17} /> Retour au tableau de bord
        </button>

        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Administration</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Gestion des membres</h1>
            <p className="mt-1 text-sm text-slate-500">Consultez et mettez à jour les fiches administratives de l’association.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Users size={20} className="text-emerald-700" />
            <span className="text-xl font-bold text-slate-900">{members.length}</span>
            <span className="text-sm text-slate-500">fiche(s)</span>
          </div>
        </header>

        {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher par nom, email ou téléphone…" className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <select value={filter} onChange={event => setFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600">
              <option value="all">Toutes les fiches</option>
              <option value="actif">Catégorie : actif</option>
              <option value="bienfaiteur">Bienfaiteurs</option>
              <option value="fondateur">Fondateurs</option>
              <option value="a_jour">Cotisation à jour</option>
              <option value="en_retard">Cotisation en retard</option>
            </select>
          </div>

          {loading && <p className="py-12 text-center text-sm text-slate-500">Chargement des fiches membres…</p>}
          {!loading && loadError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError}</div>}
          {!loading && !loadError && filteredMembers.length === 0 && (
            <div className="py-12 text-center">
              <Users size={30} className="mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700">Aucun membre trouvé</p>
              <p className="mt-1 text-sm text-slate-500">Modifiez votre recherche ou votre filtre.</p>
            </div>
          )}
          {!loading && !loadError && filteredMembers.length > 0 && (
            <div className="divide-y divide-slate-100">
              {filteredMembers.map(member => (
                <article key={member.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 font-bold text-emerald-800">
                      {(member.nom || member.displayName || 'M').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900">{member.nom || member.displayName || 'Nom non renseigné'}</h2>
                      <p className="truncate text-sm text-slate-500">{member.email || member.telephone || 'Coordonnées non renseignées'}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{member.categorie || 'Catégorie non définie'}</span>
                        {member.statut && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{member.statut.replace(/_/g, ' ')}</span>}
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={() => openEditor(member)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50">
                      <Pencil size={16} /> Modifier la fiche
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
          <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
            Les données de cotisation et les identifiants de compte ne sont pas modifiables depuis cet écran.
          </p>
        </section>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="edit-member-title" className="my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 id="edit-member-title" className="text-xl font-bold text-slate-900">Modifier la fiche</h2>
                <p className="mt-1 text-sm text-slate-500">Informations administratives uniquement</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} aria-label="Fermer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>
            <form onSubmit={saveMember} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Nom complet
                <input required value={form.nom} onChange={event => setForm(current => ({ ...current, nom: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-600" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Adresse email
                <input type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-600" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Téléphone
                <input type="tel" value={form.telephone} onChange={event => setForm(current => ({ ...current, telephone: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-600" />
              </label>
              <label className="block text-sm font-medium text-slate-700">Catégorie
                <select value={form.categorie} onChange={event => setForm(current => ({ ...current, categorie: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-600">
                  <option value="actif">Actif</option>
                  <option value="bienfaiteur">Bienfaiteur</option>
                  <option value="fondateur">Fondateur</option>
                </select>
              </label>
              {saveError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button type="button" disabled={saving} onClick={() => setEditing(null)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Annuler</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
};
