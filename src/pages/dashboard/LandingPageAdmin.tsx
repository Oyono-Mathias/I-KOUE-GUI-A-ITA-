import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { saveLandingContent, subscribeLandingContent } from '../../services/landingContent';
import { DEFAULT_LANDING_CONTENT, type LandingContent } from '../../types/landing';
import { Image, Info, HeartHandshake, MapPin, BarChart3, ChevronRight, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const allowedRoles = ['communicateur', 'president', 'president_fondateur', 'super_admin', 'admin'];
type CmsSection = 'hero' | 'about' | 'donation' | 'contact' | 'statistics';
const cmsSections: { id: CmsSection; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'hero', label: 'Bannière & Hero', description: 'Titre, visuel et appels à l’action', icon: Image },
  { id: 'about', label: 'Présentation', description: 'Histoire et mission de l’association', icon: Info },
  { id: 'donation', label: 'Dons & Mobile Money', description: 'Coordonnées publiques de réception', icon: HeartHandshake },
  { id: 'contact', label: 'Coordonnées', description: 'Contacts et réseaux sociaux', icon: MapPin },
  { id: 'statistics', label: 'Chiffres clés', description: 'Indicateurs affichés sur l’accueil', icon: BarChart3 },
];

export const LandingPageAdmin: React.FC = () => {
  const { userData, loading } = useAuth();
  const [content, setContent] = useState<LandingContent>(DEFAULT_LANDING_CONTENT);
  const [loadingContent, setLoadingContent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | ''>('');
  const [activeSection, setActiveSection] = useState<CmsSection>('hero');
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoadingContent(true);
    setLoadError('');
    return subscribeLandingContent((saved) => {
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
        statistics: saved.statistics ?? current.statistics,
        banners: saved.banners ?? current.banners,
      }));
      setLoadingContent(false);
    }, (error) => {
      console.error('CMS landing subscription:', error);
      setLoadError(error.message || 'Erreur Firestore inconnue');
      setLoadingContent(false);
    });
  }, [reloadKey]);

  if (loading) return <div className="p-8 text-center">Vérification des accès…</div>;
  if (!userData || !allowedRoles.includes(userData.role)) return <Navigate to="/dashboard" replace />;
  if (loadingContent) return <div className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center gap-3 px-6 text-center"><Loader2 className="animate-spin text-blue-900" size={28}/><p className="font-semibold text-slate-700">Connexion au contenu du site…</p><p className="text-sm text-slate-500">Les sections de gestion seront disponibles dès la synchronisation.</p></div>;

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
      setFeedbackType('success');
      setFeedback('Modifications publiées sur la Landing Page.');
    } catch (error) {
      console.error('CMS landing publication:', error);
      const code = (error as { code?: string })?.code;
      setFeedbackType('error');
      setFeedback(code === 'permission-denied'
        ? 'Publication refusée par les règles Firestore. Vérifiez que votre compte dispose du rôle autorisé.'
        : code === 'unavailable'
          ? 'Service temporairement indisponible. Vérifiez votre connexion puis réessayez.'
          : `Échec de publication${code ? ` (${code})` : ''}. Vos modifications sont conservées dans le formulaire.`);
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
            <p className="mt-2 text-sm text-slate-500">Organisez et publiez les informations visibles sur la page d’accueil.</p>
          </div>
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"><ExternalLink size={16}/> Voir le site</Link>
        </header>

        <form onSubmit={save} className="space-y-6">
          <nav aria-label="Sections du CMS" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {cmsSections.map((section) => {
              const Icon = section.icon;
              const selected = activeSection === section.id;
              return (
                <button key={section.id} type="button" onClick={() => setActiveSection(section.id)}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex min-w-[155px] shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${selected ? 'border-blue-900 bg-blue-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50'}`}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-white/15' : 'bg-slate-100 text-blue-900'}`}><Icon size={18}/></span>
                  <span className="min-w-0"><span className="block whitespace-nowrap text-sm font-bold">{section.label}</span><span className={`mt-0.5 block text-[11px] ${selected ? 'text-blue-100' : 'text-slate-500'}`}>{section.description}</span></span>
                </button>
              );
            })}
          </nav>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Édition du contenu</p><h2 className="mt-1 text-xl font-bold text-slate-900">{cmsSections.find((item) => item.id === activeSection)?.label}</h2></div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{cmsSections.findIndex((item) => item.id === activeSection) + 1} / 5</span>
            </div>
            {activeSection === 'hero' && (<div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
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
          </section></div>)}
            {activeSection === 'about' && (<div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Présentation de l'association</h2>
            <div className="grid gap-5">
              {field('Notre histoire', 'about', 'history', content.about.history, true)}
              {field('Notre mission', 'about', 'mission', content.about.mission, true)}
            </div>
            <p className="mt-4 text-xs text-slate-500">Les domaines d'intervention, actualités et rapports restent gérés dans leurs modules existants.</p>
          </section></div>)}
            {activeSection === 'donation' && (<div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
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
          </section></div>)}
            {activeSection === 'contact' && (<div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Coordonnées publiques</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {field('Adresse', 'contact', 'address', content.contact.address)}
              {field('Téléphone 1', 'contact', 'phone1', content.contact.phone1)}
              {field('Téléphone 2', 'contact', 'phone2', content.contact.phone2)}
              {field('Adresse e-mail', 'contact', 'email', content.contact.email)}
              {field('Lien Facebook', 'contact', 'facebookUrl', content.contact.facebookUrl)}
            </div>
          </section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-3 text-lg font-bold text-slate-900">Bannières supplémentaires</h2>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">URLs d'images publiques (une URL HTTPS par ligne)</span>
              <textarea rows={3} value={content.banners.join(String.fromCharCode(10))} onChange={(event) => setContent((current) => ({ ...current, banners: event.target.value.split(String.fromCharCode(10)).map((url) => url.trim()).filter(Boolean) }))} className="w-full rounded-xl border border-slate-200 p-3 text-sm" />
            </label>
          </section></div>)}
            {activeSection === 'statistics' && (<div className="space-y-5"><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
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
          </section></div>)}
          </div>
          {loadError && <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2"><AlertCircle size={18} className="mt-0.5 shrink-0"/><div><p className="font-semibold">Le contenu n’a pas pu être synchronisé.</p><p className="mt-1 break-words text-xs">{loadError}</p></div></div><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="min-h-10 rounded-xl border border-rose-200 bg-white px-4 font-semibold text-rose-700">Réessayer</button></div>}
          {feedback && <p role={feedbackType === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-2xl border p-4 text-sm ${feedbackType === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{feedbackType === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>} {feedback}</p>}
          <div className="sticky bottom-3 z-20 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500">Vos modifications ne sont publiées qu’après validation.</p>
            <button disabled={saving || loadingContent} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60">{saving ? <><Loader2 size={17} className="animate-spin"/> Publication…</> : <>Enregistrer et publier <ChevronRight size={17}/></>}</button>
          </div>
        </form>
      </div>
    </main>
  );
};
