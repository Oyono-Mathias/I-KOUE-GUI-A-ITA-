import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/communicateur.css';

// Types
interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: string;
  status: 'publie' | 'brouillon' | 'archive';
  views?: number;
  featured?: boolean;
  imageUrl?: string;
  createdAt?: any;
  publishedAt?: any;
  updatedAt?: any;
  authorName?: string;
}

interface DomainItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  order: number;
}

interface MessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'nouveau' | 'lu' | 'repondu' | 'archive';
  createdAt?: any;
  respondedAt?: any;
}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: string;
  size?: number;
  uploadedAt?: any;
}

interface SiteConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  aboutHistory?: string;
  aboutMission?: string;
  contactAddress?: string;
  contactPhone1?: string;
  contactPhone2?: string;
  contactEmail?: string;
  contactFacebook?: string;
}

const DEFAULT_DOMAINS: Omit<DomainItem, 'id'>[] = [
  { title: 'Éducation', description: "Alphabétisation, soutien scolaire, construction d'écoles, distribution de kits scolaires, formation professionnelle.", iconName: '📚', color: 'cat-education', order: 1 },
  { title: 'Santé', description: "Sensibilisation sanitaire, campagnes médicales, assistance aux malades, promotion de l'hygiène.", iconName: '🏥', color: 'cat-sante', order: 2 },
  { title: 'Agriculture', description: "Appui aux activités agricoles, formation des agriculteurs, sécurité alimentaire, protection de l'environnement.", iconName: '🌱', color: 'cat-agriculture', order: 3 },
  { title: 'Assistance Juridique', description: "Accompagnement juridique, sensibilisation aux droits humains, médiation sociale, lutte contre les VBG.", iconName: '⚖️', color: 'cat-juridique', order: 4 },
  { title: 'Action Humanitaire', description: "Assistance aux orphelins, veuves, déplacés, aide alimentaire et vestimentaire, secours d'urgence.", iconName: '🤝', color: 'cat-humanitaire', order: 5 },
  { title: 'Jeunesse', description: "Encadrement des jeunes, entrepreneuriat, activités culturelles et sportives, formation aux métiers.", iconName: '🎯', color: 'cat-jeunesse', order: 6 }
];

const DEFAULT_CONFIG: SiteConfig = {
  heroTitle: 'Agir pour la Solidarité et le Développement en RCA',
  heroSubtitle: "Promouvoir l'autonomisation des femmes, l'agriculture durable et l'accès à l'éducation pour les populations vulnérables.",
  aboutHistory: "L'Association I KOUE GUI A ITA est une association apolitique, non confessionnelle et sans but lucratif, reconnue d'utilité publique.",
  aboutMission: "Promouvoir la solidarité, l'autonomisation de la femme, le droit de l'enfant, l'environnement, l'agriculture, l'élevage, l'entraide sociale et le développement durable.",
  contactAddress: 'Galabadja II, 8ème Arrondissement, Bangui, RCA',
  contactPhone1: '+236 75 03 08 57',
  contactPhone2: '+236 72 06 12 02',
  contactEmail: 'associationikoueguiaita@gmail.com',
  contactFacebook: 'Association I KOUE GUI A ITA'
};

export const CommunicateurDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Real-time collections state
  const [news, setNews] = useState<NewsItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [editorialCalendar, setEditorialCalendar] = useState<any[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Filters & searches
  const [newsSearch, setNewsSearch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [messageFilter, setMessageFilter] = useState<string>('');
  const [mediaSearch, setMediaSearch] = useState<string>('');

  // News Editor state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('education');
  const [formStatus, setFormStatus] = useState<'publie' | 'brouillon' | 'archive'>('brouillon');
  const [formFeatured, setFormFeatured] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadText, setUploadText] = useState<string>('Cliquez pour uploader une image');

  // Active message modal
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // 🔥 FIRESTORE REAL-TIME SUBSCRIPTIONS
  // -------------------------------------------------------------
  useEffect(() => {
    let unsubNews: (() => void) | undefined;
    let unsubDomains: (() => void) | undefined;
    let unsubMessages: (() => void) | undefined;
    let unsubMedia: (() => void) | undefined;
    let unsubConfig: (() => void) | undefined;

    try {
      // 1. News listener
      const newsQuery = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      unsubNews = onSnapshot(newsQuery, (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewsItem));
        setNews(items);
        setLoadingInitial(false);
      }, (err) => {
        console.warn("Erreur chargement news (fallback local):", err);
        setLoadingInitial(false);
      });

      // 2. Domains listener
      const domainsQuery = query(collection(db, 'domains'), orderBy('order', 'asc'));
      unsubDomains = onSnapshot(domainsQuery, (snapshot) => {
        if (snapshot.empty) {
          // Initialize default domains in Firestore if empty
          DEFAULT_DOMAINS.forEach(async (item) => {
            try { await addDoc(collection(db, 'domains'), item); } catch (e) {}
          });
          setDomains(DEFAULT_DOMAINS.map((d, i) => ({ ...d, id: `init_${i}` })));
        } else {
          const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DomainItem));
          setDomains(items);
        }
      }, (err) => {
        console.warn("Erreur chargement domaines:", err);
        setDomains(DEFAULT_DOMAINS.map((d, i) => ({ ...d, id: `local_${i}` })));
      });

      // 3. Contact Messages listener
      const messagesQuery = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
      unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MessageItem));
        setMessages(items);
      }, (err) => {
        console.warn("Erreur chargement messages:", err);
      });

      // 4. Media listener
      const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
      const boardQuery = query(collection(db, 'board_messages'), orderBy('timestamp', 'asc'));
      const calendarQuery = query(collection(db, 'editorial_calendar'), orderBy('date', 'desc'));
      unsubMedia = onSnapshot(mediaQuery, (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MediaItem));
        setMedia(items);
      }, (err) => {
        console.warn("Erreur chargement media:", err);
      });

      // 5. Site Config listener
      const configDoc = doc(db, 'site_config', 'main');
      unsubConfig = onSnapshot(configDoc, (snapshot) => {
        if (snapshot.exists()) {
          setSiteConfig(snapshot.data() as SiteConfig);
        } else {
          setDoc(configDoc, { ...DEFAULT_CONFIG, updatedAt: serverTimestamp() }).catch(() => {});
          setSiteConfig(DEFAULT_CONFIG);
        }
      }, (err) => {
        console.warn("Erreur chargement site_config:", err);
      });

    } catch (error) {
      console.error("Erreur d'initialisation listeners:", error);
      setLoadingInitial(false);
    }

    return () => {
      if (unsubNews) unsubNews();
      if (unsubDomains) unsubDomains();
      if (unsubMessages) unsubMessages();
      if (unsubMedia) unsubMedia();
      if (unsubConfig) unsubConfig();
    };
  }, []);

  // Keyboard shortcut: close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMessage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // -------------------------------------------------------------
  // 📊 CALCULATED STATS & ANALYTICS
  // -------------------------------------------------------------
  const stats = useMemo(() => {
    const totalNews = news.length;
    const publishedNews = news.filter(n => n.status === 'publie').length;
    const totalViews = news.reduce((sum, n) => sum + (n.views || 0), 0);
    const totalMessages = messages.length;
    const unreadMessages = messages.filter(m => m.status === 'nouveau').length;
    const totalMedia = media.length;
    return {
      totalNews,
      publishedNews,
      totalViews,
      totalMessages,
      unreadMessages,
      totalMedia
    };
  }, [news, messages, media]);

  const draftsCount = useMemo(() => {
    return news.filter(n => n.status === 'brouillon').length;
  }, [news]);

  const topNews = useMemo(() => {
    return [...news]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5);
  }, [news]);

  const topNewsMaxViews = useMemo(() => {
    const max = Math.max(...topNews.map(n => n.views || 0), 10);
    return max;
  }, [topNews]);

  // -------------------------------------------------------------
  // 🔍 FILTERED LISTS
  // -------------------------------------------------------------
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const search = newsSearch.toLowerCase();
      const matchSearch = !search || 
        item.title.toLowerCase().includes(search) || 
        (item.description && item.description.toLowerCase().includes(search));
      const matchCat = !filterCategory || item.category === filterCategory;
      const matchStat = !filterStatus || item.status === filterStatus;
      return matchSearch && matchCat && matchStat;
    });
  }, [news, newsSearch, filterCategory, filterStatus]);

  const filteredMessages = useMemo(() => {
    if (!messageFilter) return messages;
    return messages.filter(m => m.status === messageFilter);
  }, [messages, messageFilter]);

  const filteredMedia = useMemo(() => {
    const search = mediaSearch.toLowerCase();
    if (!search) return media;
    return media.filter(m => m.name.toLowerCase().includes(search));
  }, [media, mediaSearch]);

  // -------------------------------------------------------------
  // 🧭 HELPERS & ACTIONS
  // -------------------------------------------------------------
  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      education: '📚 Éducation',
      sante: '🏥 Santé',
      agriculture: '🌱 Agriculture',
      juridique: '⚖️ Juridique',
      humanitaire: '🤝 Humanitaire',
      jeunesse: '🎯 Jeunesse',
      evenement: '🎉 Événement'
    };
    return labels[cat] || cat;
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const [showNotifPanel, setShowNotifPanel] = useState(false);

  const toggleNotifications = () => {
    setShowNotifPanel(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error('Erreur de déconnexion', err);
    }
  };

  const openNewsEditor = (newsId: string | null = null) => {
    setEditingNewsId(newsId);
    if (newsId) {
      const existing = news.find(n => n.id === newsId);
      if (existing) {
        setFormTitle(existing.title || '');
        setFormDescription(existing.description || '');
        setFormContent(existing.content || '');
        setFormCategory(existing.category || 'education');
        setFormStatus(existing.status || 'brouillon');
        setFormFeatured(existing.featured || false);
        setUploadedImageUrl(existing.imageUrl || null);
        setUploadText(existing.imageUrl ? '✓ Image attachée' : 'Cliquez pour uploader une image');
      }
    } else {
      setFormTitle('');
      setFormDescription('');
      setFormContent('');
      setFormCategory('education');
      setFormStatus('brouillon');
      setFormFeatured(false);
      setUploadedImageUrl(null);
      setUploadText('Cliquez pour uploader une image');
    }
    setActiveTab('news-editor');
    window.scrollTo(0, 0);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("⚠️ L'image ne doit pas dépasser 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImageUrl(dataUrl);
      setUploadText(file.name);
    };
    reader.readAsDataURL(file as File);
  };

  const removeImage = () => {
    setUploadedImageUrl(null);
    setUploadText('Cliquez pour uploader une image');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveNewsData = async (statusOverride?: 'publie' | 'brouillon') => {
    const title = formTitle.trim();
    const description = formDescription.trim();

    if (!title || !description) {
      alert('⚠️ Le titre et la description sont obligatoires');
      return;
    }

    const effectiveStatus = statusOverride || formStatus;

    const data: any = {
      title,
      titre: title,
      description,
      contenu: formContent || description,
      content: formContent,
      category: formCategory,
      status: effectiveStatus,
      statut: effectiveStatus,
      featured: formFeatured,
      imageUrl: uploadedImageUrl || '',
      image_url: uploadedImageUrl || '',
      updatedAt: serverTimestamp()
    };

    try {
      if (editingNewsId) {
        if (effectiveStatus === 'publie') {
          data.publishedAt = serverTimestamp();
        }
        await updateDoc(doc(db, 'news', editingNewsId), data);
      } else {
        data.createdAt = serverTimestamp();
        data.views = 0;
        data.authorName = 'Chargé de Communication';
        if (effectiveStatus === 'publie') {
          data.publishedAt = serverTimestamp();
        }
        await addDoc(collection(db, 'news'), data);
      }
      alert(effectiveStatus === 'publie' ? '✅ Actualité publiée avec succès !' : '💾 Brouillon sauvegardé !');
      setActiveTab('news');
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("Erreur sauvegarde actualité:", error);
      alert('❌ Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const publishNews = async (id: string) => {
    if (!window.confirm('🚀 Publier cette actualité sur le site public ?')) return;
    try {
      await updateDoc(doc(db, 'news', id), {
        status: 'publie',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('✅ Actualité publiée !');
    } catch (err: any) {
      alert('❌ Erreur: ' + err.message);
    }
  };

  const deleteNews = async (id: string) => {
    if (!window.confirm('⚠️ Supprimer définitivement cette actualité ?')) return;
    try {
      await deleteDoc(doc(db, 'news', id));
      alert('🗑️ Actualité supprimée');
    } catch (err: any) {
      alert('❌ Erreur: ' + err.message);
    }
  };

  // Media upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const url = evt.target?.result as string;
        try {
          await addDoc(collection(db, 'media'), {
            url,
            name: (file as File).name,
            type: (file as File).type.startsWith('image/') ? 'image' : 'document',
            size: (file as File).size,
            uploadedAt: serverTimestamp(),
            uploadedBy: 'communicateur'
          });
        } catch (err) {
          console.error("Erreur ajout média:", err);
        }
      };
      reader.readAsDataURL(file as File);
    });
  };

  // Messages management
  const openMessage = async (msg: MessageItem) => {
    setSelectedMessage(msg);
    if (msg.status === 'nouveau') {
      try {
        await updateDoc(doc(db, 'contact_messages', msg.id), { status: 'lu' });
      } catch (e) {}
    }
  };

  const markMessageAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), { status: 'lu' });
      setSelectedMessage(null);
    } catch (e) {}
  };

  const markMessageAsResponded = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), {
        status: 'repondu',
        respondedAt: serverTimestamp()
      });
      setSelectedMessage(null);
    } catch (e) {}
  };

  const archiveMessage = async (id: string) => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), { status: 'archive' });
      setSelectedMessage(null);
    } catch (e) {}
  };

  // Save Landing Config
  const saveLandingConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'site_config', 'main'), {
        ...siteConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert('✅ Modifications enregistrées et visibles instantanément sur le site public !');
    } catch (err: any) {
      alert('❌ Erreur: ' + err.message);
    }
  };

  return (
    <div className="communicateur-page">
      {/* TAB MESSAGES */}
      <div className={`tab-content ${activeTab === 'board_messages' ? 'active' : ''}`}>
        <div className="section-header" style={{ marginBottom: '8px', padding: '0 16px' }}><h2>💬 Chat Bureau</h2><p>Boîte de réception centralisée</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh', minHeight: '500px', padding: 0, overflow: 'hidden', background: '#efeae2', borderRadius: '12px' }}>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {boardMessages.map(m => {
                    const isMe = m.role === 'communicateur';
                    return (
                    <div key={m.id} style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start', 
                        background: isMe ? '#dcf8c6' : '#ffffff',
                        padding: '6px 10px',
                        borderRadius: '12px',
                        borderTopRightRadius: isMe ? '0px' : '12px',
                        borderTopLeftRadius: !isMe ? '0px' : '12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {!isMe && <div style={{ fontSize: '12px', color: '#128C7E', fontWeight: 'bold', marginBottom: '2px' }}>{m.sender}</div>}
                        <div style={{ fontSize: '14px', color: '#303030', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>{m.text}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.45)', textAlign: 'right', marginTop: '2px' }}>
                            {m.timestamp ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '...'}
                        </div>
                    </div>
                )})}
                {boardMessages.length === 0 && <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '40px', background: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '8px', alignSelf: 'center' }}>Aucun message. Commencez la discussion !</p>}
            </div>
            
            {/* Input Area */}
            <div style={{ background: '#f0f0f0', padding: '10px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <textarea 
                    id="comChatMsg" 
                    placeholder="Taper un message..." 
                    style={{ 
                        flex: 1, 
                        minHeight: '44px',
                        maxHeight: '120px', 
                        padding: '12px 16px', 
                        borderRadius: '24px', 
                        border: 'none', 
                        outline: 'none',
                        resize: 'none',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        background: '#ffffff',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
                    }} 
                    rows={1}
                    onInput={(e) => {
                        const target = e.target;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                    }}
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const input = document.getElementById('comChatMsg') as HTMLTextAreaElement;
                            if(input.value.trim()) {
                                await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Chargé de Communication', role: 'communicateur', timestamp: serverTimestamp() });
                                input.value = '';
                                input.style.height = 'auto';
                            }
                        }
                    }}
                />
                <button 
                    onClick={async () => {
                        const input = document.getElementById('comChatMsg') as HTMLTextAreaElement;
                        if(input.value.trim()) {
                            await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Chargé de Communication', role: 'communicateur', timestamp: serverTimestamp() });
                            input.value = '';
                            input.style.height = 'auto';
                        }
                    }}
                    style={{ 
                        background: '#128C7E', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '44px', 
                        height: '44px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ transform: 'translateX(2px)' }}>
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                    </svg>
                </button>
            </div>
        </div>
      </div>

      {/* TAB CALENDRIER */}
      <div className={`tab-content ${activeTab === 'calendrier' ? 'active' : ''}`}>
        <div className="section-header"><h2>📅 Calendrier Éditorial</h2><p>Planification des publications sociales et médias</p></div>
        <div className="card">
            {editorialCalendar.map(c => (
                <div key={c.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{c.titre}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>Canal: {c.canal} • Date prévue: {new Date(c.date?.seconds * 1000).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span className={`badge ${c.status === 'publie' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{c.status === 'publie' ? 'Publié' : 'Planifié'}</span>
                </div>
            ))}
            {editorialCalendar.length === 0 && <div className="empty-state">Aucune publication planifiée.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const obj = (document.getElementById('calTitle') as HTMLInputElement).value;
                const canal = (document.getElementById('calCanal') as HTMLInputElement).value;
                const date = (document.getElementById('calDate') as HTMLInputElement).value;
                if(obj && canal && date) {
                    await addDoc(collection(db, 'editorial_calendar'), { titre: obj, canal, status: 'planifie', date: new Date(date) });
                    e.target.reset();
                }
            }} style={{ marginTop: '20px' }}>
                <h3 className="card-title">Planifier une publication</h3>
                <div className="form-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input type="text" id="calTitle" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Titre / Sujet" required />
                    <input type="text" id="calCanal" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Canal (FB, Site, WhatsApp...)" required />
                    <input type="date" id="calDate" className="search-input" style={{ width: 'auto', padding: '8px' }} required />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Ajouter</button>
                </div>
            </form>
        </div>
      </div>

      {/* ============================================
           🧭 HEADER
           ============================================ */}
      <header className="dashboard-header">
        <div className="header-top">
          <div className="logo-container">
            <div className="logo">IK</div>
            <div className="logo-text">
              <h1>I KOUE GUI A ITA</h1>
              <div className="devise">ENSEMBLE · VOLONTÉ · ENGAGEMENT</div>
            </div>
          </div>
          <div className="header-actions">
            <div style={{ position: 'relative' }}>
              <button className="header-btn" onClick={toggleNotifications} aria-label="Notifications">
                🔔
                {stats.unreadMessages > 0 && (
                  <span className="notif-badge" id="notifCount">{stats.unreadMessages}</span>
                )}
              </button>
              {showNotifPanel && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '280px',
                  background: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  zIndex: 50,
                  padding: '16px',
                  color: '#1a1a1a'
                }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>🔔 Notifications</h4>
                  {stats.unreadMessages > 0 ? (
                    <div style={{ padding: '8px 0', fontSize: '13px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>💬</span>
                      <span>{stats.unreadMessages} message(s) non lu(s)</span>
                    </div>
                  ) : null}
                  {draftsCount > 0 ? (
                    <div style={{ padding: '8px 0', fontSize: '13px', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>📝</span>
                      <span>{draftsCount} brouillon(s) en attente</span>
                    </div>
                  ) : null}
                  {stats.unreadMessages === 0 && draftsCount === 0 && (
                    <div style={{ padding: '8px 0', fontSize: '13px', color: '#666' }}>Aucune nouvelle notification.</div>
                  )}
                </div>
              )}
            </div>
            <button className="header-btn" onClick={handleLogout} aria-label="Déconnexion" title="Se déconnecter">🚪</button>
          </div>
        </div>
        <div className="member-info-bar">
          <div className="member-avatar" id="userAvatar">📢</div>
          <div className="member-details">
            <div className="member-name" id="userName">{userData?.displayName || 'Chargé de Communication'}</div>
            <div className="member-role">📢 Communicateur</div>
          </div>
          <div className="member-badge">Admin</div>
        </div>
      </header>

      {/* ============================================
           📱 TAB NAVIGATION
           ============================================ */}
      <nav className="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('dashboard'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">📊</span>
          <span>Dashboard</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('news'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">📰</span>
          <span>Actualités</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'domains' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('domains'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">🌍</span>
          <span>Domaines</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'landing' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('landing'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">🏠</span>
          <span>Landing</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('media'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">🖼️</span>
          <span>Médias</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'board_messages' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('messages'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">🌍</span>
          <span>Public</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'board_messages' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('board_messages'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">💬</span>
          <span>Bureau</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calendrier' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('calendrier'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">📅</span>
          <span>Calendrier</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} 
          onClick={() => { setActiveTab('analytics'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">📈</span>
          <span>Analytics</span>
        </button>
      </nav>

      {/* ============================================
            TAB 1: DASHBOARD
           ============================================ */}
      <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`} id="tab-dashboard">
        <div className="welcome-card">
          <h2>Bienvenue, Communicateur 👋</h2>
          <p>Gérez la visibilité et les contenus publics de l'association I KOUE GUI A ITA.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" id="statsGrid">
          <div className="stat-card" onClick={() => setActiveTab('news')}>
            <div className="stat-icon">📰</div>
            <div className="stat-value">{stats.totalNews}</div>
            <div className="stat-label">Actualités</div>
            <div className="stat-sublabel">{stats.publishedNews} publiées</div>
          </div>
          <div className="stat-card success" onClick={() => setActiveTab('analytics')}>
            <div className="stat-icon">👁️</div>
            <div className="stat-value">{stats.totalViews}</div>
            <div className="stat-label">Vues totales</div>
            <div className="stat-sublabel">Toutes actualités</div>
          </div>
          <div className="stat-card alert" onClick={() => setActiveTab('messages')}>
            <div className="stat-icon">💬</div>
            <div className="stat-value">{stats.unreadMessages}</div>
            <div className="stat-label">Non lus</div>
            <div className="stat-sublabel">Sur {stats.totalMessages} messages</div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('media')}>
            <div className="stat-icon">🖼️</div>
            <div className="stat-value">{stats.totalMedia}</div>
            <div className="stat-label">Médias</div>
            <div className="stat-sublabel">Dans la bibliothèque</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Actions rapides</h3>
          </div>
          <div className="quick-actions">
            <div className="quick-action" onClick={() => openNewsEditor()}>
              <div className="qa-icon">✏️</div>
              <div className="qa-title">Nouvelle actualité</div>
              <div className="qa-subtitle">Publier sur le site</div>
            </div>
            <div className="quick-action" onClick={() => setActiveTab('landing')}>
              <div className="qa-icon">🏠</div>
              <div className="qa-title">Modifier Landing</div>
              <div className="qa-subtitle">Contenu public</div>
            </div>
            <div className="quick-action" onClick={() => setActiveTab('media')}>
              <div className="qa-icon">🖼️</div>
              <div className="qa-title">Bibliothèque média</div>
              <div className="qa-subtitle">Images & docs</div>
            </div>
            <div className="quick-action" onClick={() => setActiveTab('messages')}>
              <div className="qa-icon">💬</div>
              <div className="qa-title">Messages visiteurs</div>
              <div className="qa-subtitle">Répondre</div>
            </div>
            <div className="quick-action" onClick={() => setActiveTab('domains')}>
              <div className="qa-icon">🌍</div>
              <div className="qa-title">Domaines</div>
              <div className="qa-subtitle">6 pôles d'action</div>
            </div>
            <div className="quick-action" onClick={() => setActiveTab('analytics')}>
              <div className="qa-icon">📈</div>
              <div className="qa-title">Statistiques</div>
              <div className="qa-subtitle">Vues & engagement</div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        <div id="alertsContainer">
          {stats.unreadMessages > 0 && (
            <div className="alert-box warning">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <h4>{stats.unreadMessages} message(s) en attente</h4>
                <p>Répondez aux visiteurs dans les 48h pour maintenir une bonne image de l'association.</p>
              </div>
              <button className="btn btn-outline btn-small" onClick={() => setActiveTab('messages')}>Voir →</button>
            </div>
          )}

          {draftsCount > 0 && (
            <div className="alert-box info">
              <div className="alert-icon">📝</div>
              <div className="alert-content">
                <h4>{draftsCount} brouillon(s) en attente</h4>
                <p>Finalisez et publiez vos actualités en brouillon.</p>
              </div>
              <button className="btn btn-outline btn-small" onClick={() => setActiveTab('news')}>Voir →</button>
            </div>
          )}
        </div>

        {/* Messages récents */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💬 Messages récents</h3>
            <button className="btn btn-outline btn-small" onClick={() => setActiveTab('messages')}>Voir tout →</button>
          </div>
          <div id="recentMessages">
            {messages.slice(0, 3).length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <p style={{ color: 'var(--texte-secondaire)', margin: 0 }}>Aucun message récent</p>
              </div>
            ) : (
              messages.slice(0, 3).map(msg => (
                <div 
                  key={msg.id} 
                  className={`message-item ${msg.status === 'nouveau' ? 'unread' : ''}`} 
                  onClick={() => openMessage(msg)}
                  style={{ marginBottom: '8px' }}
                >
                  <div className="message-header">
                    <div className="message-sender">{msg.name}</div>
                    <div className="message-date">{formatDate(msg.createdAt)}</div>
                  </div>
                  <div className="message-subject">{msg.subject}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================
           📰 TAB 2: ACTUALITÉS
           ============================================ */}
      <div className={`tab-content ${activeTab === 'news' ? 'active' : ''}`} id="tab-news">
        <div className="section-header">
          <h2>📰 Gestion des Actualités</h2>
          <p id="newsCount">{news.length} actualité(s) au total</p>
        </div>

        <button className="btn btn-gold btn-block" onClick={() => openNewsEditor()} style={{ marginBottom: '16px' }}>
          ➕ Nouvelle actualité
        </button>

        {/* Filtres */}
        <div className="filters-bar">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Rechercher une actualité..." 
            value={newsSearch}
            onChange={(e) => setNewsSearch(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
            <select 
              className="filter-select" 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Toutes catégories</option>
              <option value="education">📚 Éducation</option>
              <option value="sante">🏥 Santé</option>
              <option value="agriculture">🌱 Agriculture</option>
              <option value="juridique">⚖️ Juridique</option>
              <option value="humanitaire">🤝 Humanitaire</option>
              <option value="jeunesse">🎯 Jeunesse</option>
              <option value="evenement">🎉 Événement</option>
            </select>
            <select 
              className="filter-select" 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="publie">Publié</option>
              <option value="archive">Archivé</option>
            </select>
          </div>
        </div>

        {/* Liste */}
        <div id="newsList">
          {loadingInitial ? (
            <>
              <div className="skeleton" style={{ height: '120px', marginBottom: '12px' }}></div>
              <div className="skeleton" style={{ height: '120px', marginBottom: '12px' }}></div>
              <div className="skeleton" style={{ height: '120px', marginBottom: '12px' }}></div>
            </>
          ) : filteredNews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📰</div>
              <h3>Aucune actualité trouvée</h3>
              <p>Créez votre première actualité pour le site public</p>
              <button className="btn btn-gold" onClick={() => openNewsEditor()}>➕ Créer une actualité</button>
            </div>
          ) : (
            filteredNews.map(item => (
              <div className="news-item" key={item.id}>
                <div className="news-item-header">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} className="news-item-image" alt={item.title} />
                  ) : (
                    <div className="news-item-image skeleton"></div>
                  )}
                  <div className="news-item-content">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                      <span className={`badge cat-${item.category}`}>{getCategoryLabel(item.category)}</span>
                      <span className={`badge badge-${item.status === 'publie' ? 'success' : item.status === 'brouillon' ? 'gray' : 'warning'}`}>
                        {item.status === 'publie' ? '✓ Publié' : item.status === 'brouillon' ? '📝 Brouillon' : '📦 Archivé'}
                      </span>
                      {item.featured && <span className="badge badge-gold">⭐ À la une</span>}
                    </div>
                    <div className="news-item-title">{item.title}</div>
                    <div className="news-item-desc">{item.description || ''}</div>
                    <div className="news-item-meta">
                      <span>📅 {formatDate(item.createdAt)}</span>
                      <span>👁️ {item.views || 0} vues</span>
                    </div>
                  </div>
                </div>
                <div className="news-item-actions">
                  <button className="btn btn-primary btn-small" onClick={() => openNewsEditor(item.id)}>✏️ Modifier</button>
                  {item.status !== 'publie' && (
                    <button className="btn btn-success btn-small" onClick={() => publishNews(item.id)}>🚀 Publier</button>
                  )}
                  <button className="btn btn-danger btn-small" onClick={() => deleteNews(item.id)}>🗑️ Supprimer</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================
           ✏️ TAB 3: ÉDITEUR ACTUALITÉ
           ============================================ */}
      <div className={`tab-content ${activeTab === 'news-editor' ? 'active' : ''}`} id="tab-news-editor">
        <div className="section-header">
          <h2 id="editorTitle">{editingNewsId ? "✏️ Modifier l'actualité" : "✏️ Nouvelle actualité"}</h2>
          <p>Créez ou modifiez une actualité pour le site public</p>
        </div>

        <button className="btn btn-secondary btn-small" onClick={() => setActiveTab('news')} style={{ marginBottom: '16px' }}>
          ← Retour à la liste
        </button>

        <form onSubmit={(e) => { e.preventDefault(); saveNewsData('publie'); }}>
          <div className="card">
            <div className="form-group">
              <label>Titre <span className="required">*</span></label>
              <input 
                type="text" 
                required 
                placeholder="Ex: Distribution de kits scolaires à Galabadja II"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description courte <span className="required">*</span></label>
              <textarea 
                required 
                rows={3} 
                maxLength={200} 
                placeholder="Résumé affiché dans les listes (max 200 caractères)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              ></textarea>
              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--texte-secondaire)', marginTop: '4px' }}>
                <span>{formDescription.length}</span>/200 caractères
              </div>
            </div>

            <div className="form-group">
              <label>Contenu complet</label>
              <textarea 
                rows={8} 
                placeholder="Détails complets de l'actualité..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="card">
            <div className="form-group">
              <label>Image de couverture</label>
              <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📤</div>
                <p>{uploadText}</p>
                <small>JPG, PNG (max 5 MB)</small>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageFileChange}
              />
              {uploadedImageUrl && (
                <div style={{ marginTop: '12px' }}>
                  <img src={uploadedImageUrl} alt="Aperçu" style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
                  <button type="button" className="btn btn-danger btn-small" onClick={removeImage} style={{ marginTop: '8px' }}>
                    🗑️ Supprimer l'image
                  </button>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Catégorie <span className="required">*</span></label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required>
                  <option value="education">📚 Éducation</option>
                  <option value="sante">🏥 Santé</option>
                  <option value="agriculture">🌱 Agriculture</option>
                  <option value="juridique">⚖️ Juridique</option>
                  <option value="humanitaire">🤝 Humanitaire</option>
                  <option value="jeunesse">🎯 Jeunesse</option>
                  <option value="evenement">🎉 Événement</option>
                </select>
              </div>
              <div className="form-group">
                <label>Statut</label>
                <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)}>
                  <option value="brouillon">Brouillon</option>
                  <option value="publie">Publié</option>
                  <option value="archive">Archivé</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  style={{ width: '20px', height: '20px' }} 
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                />
                <span>⭐ Mettre à la une (affiché en priorité sur la page d'accueil)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => saveNewsData('brouillon')} style={{ flex: 1 }}>
              💾 Sauvegarder brouillon
            </button>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }}>
              🚀 Publier
            </button>
          </div>
        </form>
      </div>

      {/* ============================================
           🌍 TAB 4: DOMAINES
           ============================================ */}
      <div className={`tab-content ${activeTab === 'domains' ? 'active' : ''}`} id="tab-domains">
        <div className="section-header">
          <h2>🌍 Domaines d'Intervention</h2>
          <p>Article 7 des Statuts - 6 pôles d'action</p>
        </div>

        <div id="domainsList">
          {domains.map(domain => (
            <div className="domain-card" key={domain.id}>
              <div className="domain-card-header">
                <div className="domain-icon">{domain.iconName || '🌍'}</div>
                <div style={{ flex: 1 }}>
                  <div className="domain-title">{domain.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--texte-secondaire)' }}>Ordre: {domain.order}</div>
                </div>
                <button 
                  className="btn btn-primary btn-small" 
                  onClick={() => {
                    const newDesc = window.prompt(`Modifier la description du domaine "${domain.title}":`, domain.description);
                    if (newDesc !== null && newDesc.trim() !== '') {
                      updateDoc(doc(db, 'domains', domain.id), { description: newDesc.trim() })
                        .catch(err => alert("Erreur: " + err.message));
                    }
                  }}
                >
                  ✏️
                </button>
              </div>
              <div className="domain-desc">{domain.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================
           🏠 TAB 5: LANDING PAGE EDITOR
           ============================================ */}
      <div className={`tab-content ${activeTab === 'landing' ? 'active' : ''}`} id="tab-landing">
        <div className="section-header">
          <h2>🏠 Éditeur de la Landing Page</h2>
          <p>Modifiez le contenu public visible par les visiteurs</p>
        </div>

        <div className="alert-box info">
          <div className="alert-icon">ℹ️</div>
          <div className="alert-content">
            <h4>Modification en temps réel</h4>
            <p>Les modifications apparaissent instantanément sur le site public grâce à Firestore.</p>
          </div>
        </div>

        <form onSubmit={saveLandingConfig}>
          {/* Hero Section */}
          <div className="card">
            <h3 className="card-title">🎯 Section Hero (Accueil)</h3>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Titre principal</label>
              <input 
                type="text" 
                value={siteConfig.heroTitle || ''} 
                onChange={(e) => setSiteConfig({ ...siteConfig, heroTitle: e.target.value })}
                placeholder="Agir pour la Solidarité et le Développement en RCA" 
              />
            </div>
            <div className="form-group">
              <label>Sous-titre</label>
              <textarea 
                rows={3} 
                value={siteConfig.heroSubtitle || ''} 
                onChange={(e) => setSiteConfig({ ...siteConfig, heroSubtitle: e.target.value })}
                placeholder="Promouvoir l'autonomisation des femmes..." 
              />
            </div>
          </div>

          {/* À Propos */}
          <div className="card">
            <h3 className="card-title">ℹ️ Section À Propos</h3>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Historique</label>
              <textarea 
                rows={4} 
                value={siteConfig.aboutHistory || ''} 
                onChange={(e) => setSiteConfig({ ...siteConfig, aboutHistory: e.target.value })}
                placeholder="L'Association I KOUE GUI A ITA est une association apolitique..." 
              />
            </div>
            <div className="form-group">
              <label>Mission (Article 5)</label>
              <textarea 
                rows={3} 
                value={siteConfig.aboutMission || ''} 
                onChange={(e) => setSiteConfig({ ...siteConfig, aboutMission: e.target.value })}
                placeholder="Promouvoir la solidarité, l'autonomisation..." 
              />
            </div>
          </div>

          {/* Contact */}
          <div className="card">
            <h3 className="card-title">📞 Informations de Contact</h3>
            <div className="form-group" style={{ marginTop: '14px' }}>
              <label>Adresse</label>
              <input 
                type="text" 
                value={siteConfig.contactAddress || ''} 
                onChange={(e) => setSiteConfig({ ...siteConfig, contactAddress: e.target.value })}
                placeholder="Galabadja II, 8ème Arrondissement, Bangui" 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Téléphone 1</label>
                <input 
                  type="tel" 
                  value={siteConfig.contactPhone1 || ''} 
                  onChange={(e) => setSiteConfig({ ...siteConfig, contactPhone1: e.target.value })}
                  placeholder="+236 75 03 08 57" 
                />
              </div>
              <div className="form-group">
                <label>Téléphone 2 (WhatsApp)</label>
                <input 
                  type="tel" 
                  value={siteConfig.contactPhone2 || ''} 
                  onChange={(e) => setSiteConfig({ ...siteConfig, contactPhone2: e.target.value })}
                  placeholder="+236 72 06 12 02" 
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={siteConfig.contactEmail || ''} 
                onChange={(e) => setSiteConfig({ ...siteConfig, contactEmail: e.target.value })}
                placeholder="associationikoueguiaita@gmail.com" 
              />
            </div>
            <div className="form-group">
              <label>Page Facebook</label>
              <input 
                type="text" 
                value={siteConfig.contactFacebook || ''} 
                onChange={(e) => setSiteConfig({ ...siteConfig, contactFacebook: e.target.value })}
                placeholder="Association I KOUE GUI A ITA" 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold btn-block">
            💾 Enregistrer les modifications
          </button>
        </form>
      </div>

      {/* ============================================
           🖼️ TAB 6: BIBLIOTHÈQUE MÉDIA
           ============================================ */}
      <div className={`tab-content ${activeTab === 'media' ? 'active' : ''}`} id="tab-media">
        <div className="section-header">
          <h2>🖼️ Bibliothèque Média</h2>
          <p>Gérez vos images et documents</p>
        </div>

        <div className="upload-zone" onClick={() => mediaInputRef.current?.click()} style={{ marginBottom: '16px' }}>
          <div className="upload-icon">📤</div>
          <p>Cliquez pour uploader des médias</p>
          <small>JPG, PNG, PDF (max 10 MB)</small>
        </div>
        <input 
          type="file" 
          ref={mediaInputRef} 
          accept="image/*,.pdf" 
          multiple 
          style={{ display: 'none' }} 
          onChange={handleMediaUpload}
        />

        <div className="filters-bar">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Rechercher un média..." 
            value={mediaSearch}
            onChange={(e) => setMediaSearch(e.target.value)}
          />
        </div>

        <div className="media-grid" id="mediaGrid">
          {filteredMedia.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-icon">🖼️</div>
              <h3>Aucun média</h3>
              <p>Uploadez votre première image</p>
            </div>
          ) : (
            filteredMedia.map(item => (
              <div 
                className="media-item" 
                key={item.id} 
                onClick={() => {
                  if (item.url) window.open(item.url, '_blank');
                }}
              >
                {item.url ? (
                  <img src={item.url} alt={item.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>
                    🖼️
                  </div>
                )}
                <div className="media-item-overlay">{item.name}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================
           💬 TAB 7: MESSAGES
           ============================================ */}
      <div className={`tab-content ${activeTab === 'board_messages' ? 'active' : ''}`} id="tab-messages">
        <div className="section-header">
          <h2>💬 Messages des Visiteurs</h2>
          <p id="messagesCount">{messages.length} message(s) au total</p>
        </div>

        <div className="filters-bar">
          <select 
            className="filter-select" 
            value={messageFilter} 
            onChange={(e) => setMessageFilter(e.target.value)}
          >
            <option value="">Tous les messages</option>
            <option value="nouveau">Nouveaux</option>
            <option value="lu">Lus</option>
            <option value="repondu">Répondus</option>
            <option value="archive">Archivés</option>
          </select>
        </div>

        <div id="messagesList">
          {filteredMessages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h3>Aucun message</h3>
              <p>Les messages des visiteurs apparaîtront ici</p>
            </div>
          ) : (
            filteredMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`message-item ${msg.status === 'nouveau' ? 'unread' : ''}`} 
                onClick={() => openMessage(msg)}
              >
                <div className="message-header">
                  <div className="message-sender">{msg.name}</div>
                  <div className="message-date">{formatDate(msg.createdAt)}</div>
                </div>
                <div className="message-subject">{msg.subject}</div>
                <div className="message-preview">{msg.message}</div>
                <div style={{ marginTop: '6px' }}>
                  <span className={`badge badge-${msg.status === 'nouveau' ? 'info' : msg.status === 'repondu' ? 'success' : 'gray'}`}>
                    {msg.status === 'nouveau' ? '✨ Nouveau' : msg.status === 'lu' ? '👁️ Lu' : msg.status === 'repondu' ? '✓ Répondu' : '📦 Archivé'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================
           📈 TAB 8: ANALYTICS
           ============================================ */}
      <div className={`tab-content ${activeTab === 'analytics' ? 'active' : ''}`} id="tab-analytics">
        <div className="section-header">
          <h2>📈 Statistiques & Analytics</h2>
          <p>Performance de vos contenus</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👁️</div>
            <div className="stat-value" id="statViews">{stats.totalViews}</div>
            <div className="stat-label">Vues totales</div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">📰</div>
            <div className="stat-value" id="statPublished">{stats.publishedNews}</div>
            <div className="stat-label">Actualités publiées</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-value" id="statMessages">{stats.totalMessages}</div>
            <div className="stat-label">Messages reçus</div>
          </div>
          <div className="stat-card alert">
            <div className="stat-icon">⏳</div>
            <div className="stat-value" id="statUnread">{stats.unreadMessages}</div>
            <div className="stat-label">Non lus</div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">📊 Vues par actualité (Top 5)</h3>
          <div className="chart-placeholder">
            <div className="chart-bar" id="viewsChart">
              {topNews.length > 0 ? (
                topNews.map((n, i) => {
                  const val = n.views || 0;
                  const pct = Math.max(15, Math.min(100, Math.round((val / topNewsMaxViews) * 100)));
                  return (
                    <div 
                      key={n.id || i} 
                      className="chart-bar-item" 
                      style={{ height: `${pct}%` }} 
                      data-value={val}
                      title={`${n.title}: ${val} vues`}
                    />
                  );
                })
              ) : (
                <>
                  <div className="chart-bar-item" style={{ height: '60%' }} data-value="0"></div>
                  <div className="chart-bar-item" style={{ height: '80%' }} data-value="0"></div>
                  <div className="chart-bar-item" style={{ height: '45%' }} data-value="0"></div>
                  <div className="chart-bar-item" style={{ height: '95%' }} data-value="0"></div>
                  <div className="chart-bar-item" style={{ height: '70%' }} data-value="0"></div>
                </>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--texte-secondaire)', margin: 0 }}>Données Firestore synchronisées en temps réel</p>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">🏆 Actualités les plus vues</h3>
          <div id="topNews">
            {topNews.length === 0 ? (
              <p style={{ color: 'var(--texte-secondaire)', textAlign: 'center', margin: '16px 0' }}>Aucune donnée disponible</p>
            ) : (
              topNews.map((n, index) => (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--bordure)' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--or-solaire)', minWidth: '30px' }}>#{index + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--bleu-rca)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--texte-secondaire)' }}>{getCategoryLabel(n.category)}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--bleu-rca)' }}>{n.views || 0} 👁️</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================
            MODAL MESSAGE DÉTAIL
           ============================================ */}
      {selectedMessage && (
        <div 
          id="messageModal" 
          style={{ display: 'block', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', overflowY: 'auto' }}
          onClick={(e) => {
            if ((e.target as HTMLElement).id === 'messageModal') setSelectedMessage(null);
          }}
        >
          <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', margin: '20px auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--bleu-rca)', margin: 0 }}>💬 Message</h3>
              <button onClick={() => setSelectedMessage(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
            </div>
            <div id="messageDetail">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--texte-secondaire)', marginBottom: '4px' }}>De:</div>
                <div style={{ fontWeight: 700, color: 'var(--bleu-rca)' }}>{selectedMessage.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--texte-secondaire)' }}>{selectedMessage.email}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--texte-secondaire)', marginBottom: '4px' }}>Sujet:</div>
                <div style={{ fontWeight: 600 }}>{selectedMessage.subject}</div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--texte-secondaire)', marginBottom: '4px' }}>Message:</div>
                <div style={{ background: 'var(--fond-alterne)', padding: '12px', borderRadius: '8px', lineHeight: '1.6' }}>{selectedMessage.message}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-success btn-small" onClick={() => markMessageAsResponded(selectedMessage.id)}>✓ Marquer répondu</button>
                <button className="btn btn-primary btn-small" onClick={() => markMessageAsRead(selectedMessage.id)}>👁️ Marquer lu</button>
                <button className="btn btn-secondary btn-small" onClick={() => archiveMessage(selectedMessage.id)}>📦 Archiver</button>
                <a href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`} className="btn btn-gold btn-small">📧 Répondre par email</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
           📱 BOTTOM NAV (mobile)
           ============================================ */}
      <nav className="bottom-nav" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
        <button style={{ minWidth: '80px', flex: '0 0 auto' }} onClick={() => { setActiveTab('dashboard'); window.scrollTo(0, 0); }} className={activeTab === 'dashboard' ? 'active' : ''}>
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </button>
        <button style={{ minWidth: '80px', flex: '0 0 auto' }} onClick={() => { setActiveTab('news'); window.scrollTo(0, 0); }} className={activeTab === 'news' ? 'active' : ''}>
          <span className="nav-icon">📰</span>
          <span>Actus</span>
        </button>
        <button onClick={() => { setActiveTab('board_messages'); window.scrollTo(0, 0); }} className={activeTab === 'board_messages' ? 'active' : ''} style={{ minWidth: '80px', flex: '0 0 auto' }}>
          <span className="nav-icon">💬</span>
          <span>Bureau</span>
        </button>
        <button onClick={() => { setActiveTab('calendrier'); window.scrollTo(0, 0); }} className={activeTab === 'calendrier' ? 'active' : ''} style={{ minWidth: '80px', flex: '0 0 auto' }}>
          <span className="nav-icon">📅</span>
          <span>Calendrier</span>
        </button>
        <button onClick={() => { setActiveTab('messages'); window.scrollTo(0, 0); }} className={activeTab === 'messages' ? 'active' : ''} style={{ minWidth: '80px', flex: '0 0 auto' }}>
          <span className="nav-icon">💬</span>
          <span>Messages</span>
        </button>
        <button style={{ minWidth: '80px', flex: '0 0 auto' }} onClick={() => { setActiveTab('analytics'); window.scrollTo(0, 0); }} className={activeTab === 'analytics' ? 'active' : ''}>
          <span className="nav-icon">📈</span>
          <span>Stats</span>
        </button>
      </nav>

      {/* ============================================
            WHATSAPP FAB
           ============================================ */}
      <a 
        href="https://wa.me/23675030857?text=Bonjour,%20message%20depuis%20le%20Dashboard%20Communicateur" 
        className="whatsapp-float" 
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label="WhatsApp"
      >
        💬
      </a>
    </div>
  );
};

export default CommunicateurDashboard;
