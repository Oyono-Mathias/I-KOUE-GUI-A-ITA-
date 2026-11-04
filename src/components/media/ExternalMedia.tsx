import React from 'react';

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
    if (id && /^[\w-]{11}$/.test(id)) return { url: parsed.toString(), kind: 'youtube', provider: 'youtube', embedUrl: 'https://www.youtube-nocookie.com/embed/' + id };
    return { url: parsed.toString(), kind: 'link', provider: 'youtube' };
  }
  if (isHost(host, 'facebook.com') || host === 'fb.watch') {
    const isVideo = /\/(watch|videos|reel|share\/v|share\/r)\b/.test(path) || host === 'fb.watch';
    const isPost = /\/(posts|permalink)\b/.test(path);
    if (isVideo || isPost) {
      const endpoint = isVideo ? 'video.php' : 'post.php';
      return { url: parsed.toString(), kind: 'facebook', provider: 'facebook', embedUrl: 'https://www.facebook.com/plugins/' + endpoint + '?href=' + encodeURIComponent(parsed.toString()) + '&show_text=false&width=560' };
    }
    return { url: parsed.toString(), kind: 'link', provider: 'facebook' };
  }
  if (isHost(host, 'drive.google.com') || isHost(host, 'docs.google.com')) {
    const fileId = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] || parsed.searchParams.get('id');
    if (fileId) {
      const docsKind = parsed.pathname.match(/^\/(document|spreadsheets|presentation)\//)?.[1];
      const embedUrl = docsKind ? 'https://docs.google.com/' + docsKind + '/d/' + fileId + '/preview' : 'https://drive.google.com/file/d/' + fileId + '/preview';
      return { url: parsed.toString(), kind: 'drive', provider: 'google-drive', embedUrl };
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

interface ExternalMediaProps { url?: string | null; title?: string; className?: string; compact?: boolean; fit?: 'cover' | 'contain'; }
export const ExternalMedia: React.FC<ExternalMediaProps> = ({ url, title = 'Média externe', className = '', compact = false, fit = 'contain' }) => {
  const legacyImage = typeof url === 'string' && /^data:image\/(?:jpeg|png|gif|webp);base64,/i.test(url);
  const media = url ? parseExternalMediaUrl(url) : null;
  const frameStyle: React.CSSProperties = { width: '100%', height: '100%', minHeight: compact ? 150 : 220, aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 12, background: '#f1f5f9' };
  const mediaStyle: React.CSSProperties = { display: 'block', width: '100%', height: '100%', minHeight: compact ? 150 : 220, objectFit: fit, border: 0 };
  if (legacyImage && url) return <div className={className} style={frameStyle}><img src={url} alt={title} loading="lazy" style={mediaStyle} /></div>;
  if (!media) return <div className={className} style={{ ...frameStyle, display: 'grid', placeItems: 'center', padding: 16, color: '#64748b', fontSize: 13 }}>Collez un lien HTTPS valide pour afficher l’aperçu.</div>;
  if (media.kind === 'image') return <div className={className} style={frameStyle}><img src={media.url} alt={title} loading="lazy" referrerPolicy="no-referrer" style={mediaStyle} /></div>;
  if (media.kind === 'video') return <div className={className} style={frameStyle}><video src={media.url} controls preload="metadata" playsInline style={mediaStyle}>Votre navigateur ne prend pas en charge la lecture vidéo.</video></div>;
  if (media.kind === 'audio') return <div className={className} style={{ ...frameStyle, height: 'auto', minHeight: 90, aspectRatio: 'auto', display: 'flex', alignItems: 'center', padding: 16 }}><audio src={media.url} controls preload="metadata" style={{ width: '100%' }} /></div>;
  if (media.embedUrl && ['youtube', 'facebook', 'drive'].includes(media.kind)) return <div className={className} style={frameStyle}><iframe src={media.embedUrl} title={title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow={media.kind === 'youtube' ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share' : undefined} allowFullScreen style={mediaStyle} /></div>;
  if (media.kind === 'pdf') return <div className={className} style={frameStyle}><iframe src={media.url} title={title} loading="lazy" style={mediaStyle} /></div>;
  return <div className={className} style={{ ...frameStyle, minHeight: 110, height: 'auto', aspectRatio: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, padding: 16 }}><span style={{ color: '#475569', fontSize: 13, textAlign: 'center' }}>Aperçu intégré indisponible pour ce lien.</span><a href={media.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 13 }}>Ouvrir le média externe ↗</a></div>;
};

interface ExternalMediaFieldProps { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helperText?: string; }
export const ExternalMediaField: React.FC<ExternalMediaFieldProps> = ({ label, value, onChange, placeholder = 'Coller un lien Google Drive, YouTube, Facebook, image, vidéo, audio ou PDF…', helperText = 'Lien HTTPS public requis. Le fournisseur doit autoriser l’intégration ou le partage public.' }) => {
  const parsed = value.trim() ? parseExternalMediaUrl(value) : null;
  return <div className="space-y-3"><label className="block space-y-2"><span className="text-sm font-semibold text-slate-700">{label}</span><input type="url" inputMode="url" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} autoComplete="url" className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><p className="text-xs text-slate-500">{helperText}</p>{value.trim() && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">{parsed ? <><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-600">Aperçu · {parsed.kind}</span><span className="text-xs text-slate-500">{parsed.provider}</span></div><ExternalMedia url={parsed.url} title={label} compact /></> : <p role="alert" className="text-sm text-rose-700">Lien invalide. Utilisez une adresse HTTPS complète.</p>}</div>}</div>;
};
