import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { saveLandingContent, subscribeLandingContent } from '../../services/landingContent';
import { DEFAULT_LANDING_CONTENT, type LandingContent } from '../../types/landing';

const allowedRoles = ['communicateur', 'president', 'president_fondateur', 'super_admin', 'admin'];

export const LandingPageAdmin: React.FC = () => {
  const { userData, loading } = useAuth();
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [loadingContent, setLoadingContent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => subscribeLandingContent((saved) => {
    if (saved) setContent((current) => ({
      ...current,
      ...saved,
      hero: { ...current.hero, ...saved.hero },
      about: { ...current.about, ...saved.about },
      donation: {
        ...current.donation,
        ...saved.donation,
        mobileMoney: { ...current.donation.mobileMoney, ...saved.donation?.mobileMoney },
      },
      contact: { ...current.contact, ...saved.contact },
    }));
    setLoadingContent(false);
  }, (error) => {
    console.error('CMS landing:', error);
    setFeedback('Impossible de charger le contenu. Vérifiez vos autorisations.');
    setLoadingContent(false);
  }), []);

  if (loading) return <div className="p-8 text-center">Vérification des accès…</div>;
  if (!userData || !allowedRoles.includes(userData.role)) return <Navigate to="/dashboard" replace />;
  if (loadingContent) return <div className="p-8 text-center">Chargement du CMS…</div>;

  const updateStatistic = (index: number, key: 'label' | 'value', value: string) => {
    setContent((current) => ({
      ...current,
      statistics: current.statistics.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }));
  };

  const update = (section: 'hero' | 'about' | 'contact' | 'donation', field: string, value: string) => {
    setContent((current) => {
      if (section === 'donation' && field.startsWith('mobileMoney.')) {
        const key = field.slice('mobileMoney.'.length) as keyof LandingContent['donation']['mobileMoney'];
        return { ...current, donation: { ...current.donation, mobileMoney: { ...current.donation.mobileMoney, [key]: value } } };
      }
      return { ...current, [section]: { ...current[section], [field]: value } };
    });
  };

  const field = (label: string, section: 'hero' | 'about' | 'contact' | 'donation', name: string, value: string, multiline = false) => (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {multiline ? (
        <textarea rows={4} value={value || ''} onChange={(event) => update(section, name, event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      ) : (
        <input value={value || ''} onChange={(event) => update(section, name, event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
      )}
    </label>
  );

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userData?.uid) return;
    setSaving(true);
    setFeedback('');
    try {
      await saveLandingContent(content, userData.uid);
      setFeedback('Modifications publiées sur la Landing Page.');
    } catch (error) {
      console.error(error);
      setFeedback('Enregistrement refusé. Vérifiez votre rôle et réessayez.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 pb-28 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">I KOUE GUI A ITA · CMS</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Gestion du site public</h1>
            <p className="mt-2 text-sm text-slate-500">Les changements sont publiés sur le site après enregistrement.</p>
          </div>
          <Link to="/" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">Voir le site</Link>
        </header>

        <form onSubmit={save} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Bannière et section Hero</h2>
            <div className="grid gap-5">
              {field('Titre principal', 'hero', 'title', content.hero.title)}
              {field('Sous-titre', 'hero', 'subtitle', content.hero.subtitle, true)}
              {field('URL de la bannière (image publique)', 'hero', 'bannerUrl', content.hero.bannerUrl)}
              <div className="grid gap-5 sm:grid-cols-2">
                {field('Texte du bouton principal', 'hero', 'primaryCtaLabel', content.hero.primaryCtaLabel)}
                {field('Lien du bouton principal', 'hero', 'primaryCtaUrl', content.hero.primaryCtaUrl)}
                {field('Texte du bouton secondaire', 'hero', 'secondaryCtaLabel', content.hero.secondaryCtaLabel)}
                {field('Lien du bouton secondaire', 'hero', 'secondaryCtaUrl', content.hero.secondaryCtaUrl)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Présentation de l'association</h2>
            <div className="grid gap-5">
              {field('Notre histoire', 'about', 'history', content.about.history, true)}
              {field('Notre mission', 'about', 'mission', content.about.mission, true)}
            </div>
            <p className="mt-4 text-xs text-slate-500">Les domaines d'intervention, actualités et rapports restent gérés dans leurs modules existants.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Dons et Mobile Money</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {field('Titre de la section', 'donation', 'title', content.donation.title)}
              {field('Texte de présentation', 'donation', 'description', content.donation.description, true)}
              {field('Numéro Orange Money', 'donation', 'mobileMoney.orangeMoneyNumber', content.donation.mobileMoney.orangeMoneyNumber)}
              {field('Lien Orange Money (facultatif)', 'donation', 'mobileMoney.orangeMoneyLink', content.donation.mobileMoney.orangeMoneyLink)}
              {field('Numéro Moov Money', 'donation', 'mobileMoney.moovMoneyNumber', content.donation.mobileMoney.moovMoneyNumber)}
              {field('Lien Moov Money (facultatif)', 'donation', 'mobileMoney.moovMoneyLink', content.donation.mobileMoney.moovMoneyLink)}
              {field('Numéro Airtel Money', 'donation', 'mobileMoney.airtelMoneyNumber', content.donation.mobileMoney.airtelMoneyNumber)}
              {field('Lien Airtel Money (facultatif)', 'donation', 'mobileMoney.airtelMoneyLink', content.donation.mobileMoney.airtelMoneyLink)}
            </div>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">Ne saisissez jamais de code PIN, mot de passe, clé API ou identifiant secret Mobile Money ici. Seules les coordonnées publiques de réception sont prévues.</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Coordonnées publiques</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {field('Adresse', 'contact', 'address', content.contact.address)}
              {field('Téléphone 1', 'contact', 'phone1', content.contact.phone1)}
              {field('Téléphone 2', 'contact', 'phone2', content.contact.phone2)}
              {field('Adresse e-mail', 'contact', 'email', content.contact.email)}
              {field('Lien Facebook', 'contact', 'facebookUrl', content.contact.facebookUrl)}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Bannières supplémentaires</h2>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">URLs d'images publiques (une URL HTTPS par ligne)</span>
              <textarea rows={3} value={content.banners.join(String.fromCharCode(10))} onChange={(event) => setContent((current) => ({ ...current, banners: event.target.value.split(String.fromCharCode(10)).map((url) => url.trim()).filter(Boolean) }))} className="w-full rounded-xl border border-slate-200 p-3 text-sm" />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Chiffres clés</h2>
            <p className="text-sm text-slate-500">Ajoutez, modifiez ou retirez les indicateurs affichés sur la page d'accueil. Les domaines, actualités et rapports restent connectés à leurs collections et modules existants.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {content.statistics.map((stat, index) => (
                <div key={index} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Indicateur {index + 1}</span>
                    <button type="button" onClick={() => setContent((current) => ({ ...current, statistics: current.statistics.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50">Retirer</button>
                  </div>
                  <label className="text-xs font-semibold text-slate-600">Valeur
                    <input value={stat.value} onChange={(event) => updateStatistic(index, 'value', event.target.value)} maxLength={32} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">Libellé
                    <input value={stat.label} onChange={(event) => updateStatistic(index, 'label', event.target.value)} maxLength={80} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setContent((current) => ({ ...current, statistics: [...current.statistics, { label: '', value: '' }] }))} disabled={content.statistics.length >= 8} className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50">+ Ajouter un chiffre clé</button>
          </section>

          {feedback && <p role="status" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{feedback}</p>}
          <div className="sticky bottom-4 flex justify-end">
            <button disabled={saving} className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Publication…' : 'Enregistrer et publier'}</button>
          </div>
        </form>
      </div>
    </main>
  );
};
