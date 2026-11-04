import React, { useEffect, useState } from 'react';

export type ExternalMediaKind = 'image' | 'video' | 'audio' | 'youtube' | 'facebook' | 'drive' | 'pdf' | 'link';
export type ExternalMediaProvider = 'youtube' | 'facebook' | 'google-drive' | 'direct' | 'external';
export interface ParsedExternalMedia { url: string; kind: ExternalMediaKind; provider: ExternalMediaProvider; embedUrl?: string; }
const isHost = (hostname: string, domain: string) => hostname === domain || hostname.endsWith('.' + domain);

export const parseExternalMediaUrl = (value: string): ParsedExternalMedia | null => {
  const raw = value.trim();
  if (!raw) return null;
  let parsed: URL;
  try { parsed = new URL(raw); } catch { return null; }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  if (isHost(host, 'youtube.com') || isHost(host, 'youtube-nocookie.com') || host === 'youtu.be') {
    const id = host === 'youtu.be' ? parsed.pathname.split('/').filter(Boolean)[0] : parsed.searchParams.get('v') || parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) return { url: parsed.toString(), kind: 'youtube', provider: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0' };
    return { url: parsed.toString(), kind: 'link', provider: 'youtube' };
  }
  if (isHost(host, 'facebook.com') || host === 'fb.watch') {
    const isVideo = /\/(watch|videos|reel|share\/v|share\/r)\b/.test(path) || host === 'fb.watch';
    const isPost = /\/(posts|permalink)\b/.test(path);
    if (isVideo || isPost) return { url: parsed.toString(), kind: 'facebook', provider: 'facebook', embedUrl: 'https://www.facebook.com/plugins/' + (isVideo ? 'video.php' : 'post.php') + '?href=' + encodeURIComponent(parsed.toString()) + '&show_text=false&width=560' };
    return { url: parsed.toString(), kind: 'link', provider: 'facebook' };
  }
  if (isHost(host, 'drive.google.com') || isHost(host, 'docs.google.com')) {
    const fileId = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] || parsed.searchParams.get('id');
    if (fileId) {
      const docsKind = parsed.pathname.match(/^\/(document|spreadsheets|presentation)\//)?.[1];
      return { url: parsed.toString(), kind: 'drive', provider: 'google-drive', embedUrl: docsKind ? 'https://docs.google.com/' + docsKind + '/d/' + fileId + '/preview' : 'https://drive.google.com/file/d/' + fileId + '/preview' };
    }
    return { url: parsed.toString(), kind: 'link', provider: 'google-drive' };
  }
  const extension = path.split('.').pop() || '';
  if (['jpg','jpeg','png','gif','webp','avif','svg'].includes(extension)) return { url: parsed.toString(), kind: 'image', provider: 'direct' };
  if (['mp4','webm','ogv','ogg'].includes(extension)) return { url: parsed.toString(), kind: 'video', provider: 'direct' };
  if (['mp3','wav','m4a','aac','oga','opus'].includes(extension)) return { url: parsed.toString(), kind: 'audio', provider: 'direct' };
  if (extension === 'pdf') return { url: parsed.toString(), kind: 'pdf', provider: 'direct' };
  return { url: parsed.toString(), kind: 'link', provider: 'external' };
};
export const isValidExternalMediaUrl = (value: string): boolean => parseExternalMediaUrl(value) !== null;

interface ExternalMediaProps { url?: string | null; title?: string; className?: string; compact?: boolean; fit?: 'cover' | 'contain'; lightbox?: boolean; }
const UnavailableMedia: React.FC<{ title: string; provider?: string }> = ({ title, provider }) => (
  <div className="external-media-unavailable" role="status">
    <span aria-hidden="true">ⓘ</span>
    <strong>Contenu momentanément indisponible</strong>
    <span>{provider ? provider + ' ne permet pas actuellement l’intégration de ce contenu.' : 'Ce format ne dispose pas d’une visionneuse intégrée compatible.'}</span>
    <small>{title}</small>
  </div>
);

export const ExternalMedia: React.FC<ExternalMediaProps> = ({ url, title = 'Média externe', className = '', compact = false, fit = 'contain', lightbox = false }) => {
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => { setLoadError(false); setModalOpen(false); }, [url]);
  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [modalOpen]);

  const legacyImage = typeof url === 'string' && /^data:image\/(?:jpeg|png|gif|webp);base64,/i.test(url);
  const media = url ? parseExternalMediaUrl(url) : null;
  const frameStyle: React.CSSProperties = { width: '100%', height: '100%', minHeight: compact ? 150 : 220, aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 12, background: '#f1f5f9' };
  const mediaStyle: React.CSSProperties = { display: 'block', width: '100%', height: '100%', minHeight: compact ? 150 : 220, objectFit: fit, border: 0 };
  const unavailable = (provider?: string) => <UnavailableMedia title={title} provider={provider} />;
  const renderContent = (inModal = false): React.ReactNode => {
    const style = inModal ? { ...mediaStyle, minHeight: 'min(72vh, 760px)', maxHeight: '76vh', aspectRatio: 'auto' } as React.CSSProperties : mediaStyle;
    if (legacyImage && url) return <img src={url} alt={title} loading="lazy" style={style} />;
    if (!media) return unavailable();
    if (loadError) return unavailable(media.provider === 'youtube' ? 'YouTube' : media.provider === 'facebook' ? 'Facebook' : media.provider === 'google-drive' ? 'Google Drive' : undefined);
    if (media.kind === 'image') return <img src={media.url} alt={title} loading="lazy" referrerPolicy="no-referrer" onError={() => setLoadError(true)} style={style} />;
    if (media.kind === 'video') return <video src={media.url} controls preload="metadata" playsInline onError={() => setLoadError(true)} style={style}>Votre navigateur ne prend pas en charge la lecture vidéo.</video>;
    if (media.kind === 'audio') return <div className="external-media-audio"><audio src={media.url} controls preload="metadata" onError={() => setLoadError(true)} /></div>;
    if (media.embedUrl && ['youtube', 'facebook', 'drive'].includes(media.kind)) return <iframe src={media.embedUrl} title={title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow={media.kind === 'youtube' ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' : 'autoplay; encrypted-media; picture-in-picture'} allowFullScreen style={style} onError={() => setLoadError(true)} />;
    if (media.kind === 'pdf') return <iframe src={media.url + '#toolbar=0&navpanes=0'} title={title} loading="lazy" style={style} onError={() => setLoadError(true)} />;
    return unavailable(media.provider === 'external' ? undefined : media.provider);
  };
  const content = <div className={className} style={frameStyle}>{renderContent()}</div>;
  if (!lightbox) return content;
  return <>
    <button type="button" className="external-media-trigger" onClick={() => setModalOpen(true)} aria-label={'Ouvrir : ' + title}>
      {content}<span className="external-media-open-hint">⌕ <span>Consulter</span></span>
    </button>
    {modalOpen && <div className="external-media-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModalOpen(false); }}>
      <section className="external-media-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header className="external-media-dialog__header"><div><span>ESPACE MÉDIATHÈQUE</span><h2>{title}</h2></div><button type="button" onClick={() => setModalOpen(false)} aria-label="Fermer la visionneuse">×</button></header>
        <div className="external-media-dialog__content">{renderContent(true)}</div>
        <footer>Association I KOUE GUI A ITA · Ensemble · Volonté · Engagement</footer>
      </section>
    </div>}
  </>;
};

interface ExternalMediaFieldProps { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helperText?: string; }
export const ExternalMediaField: React.FC<ExternalMediaFieldProps> = ({ label, value, onChange, placeholder = 'Coller un lien Google Drive, YouTube, Facebook, image, vidéo, audio ou PDF…', helperText = 'Lien HTTPS public requis. Le fournisseur doit autoriser l’intégration ou le partage public.' }) => {
  const parsed = value.trim() ? parseExternalMediaUrl(value) : null;
  return <div className="space-y-3"><label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">{label}</span><input type="url" inputMode="url" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoComplete="url" className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><p className="text-xs text-slate-500">{helperText}</p>{value.trim() && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">{parsed ? <><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Aperçu · {parsed.kind}</span><span className="text-xs text-slate-500">{parsed.provider}</span></div><ExternalMedia url={parsed.url} title={label} compact /></> : <p role="alert" className="text-sm text-rose-700">Lien invalide. Utilisez une adresse HTTPS complète.</p>}</div>}</div>;
};
