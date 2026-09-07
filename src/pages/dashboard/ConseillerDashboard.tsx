import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import './ConseillerDashboard.css';

export const ConseillerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Data State
  const [avis, setAvis] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [projets, setProjets] = useState<any[]>([]);
  const [rapports, setRapports] = useState<any[]>([]);
  const [partenaires, setPartenaires] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [commissionMembers, setCommissionMembers] = useState<any[]>([]);

  // Filters
  const [avisFilter, setAvisFilter] = useState('all');
  const [rapportFilter, setRapportFilter] = useState('all');
  const [partnerFilter, setPartnerFilter] = useState('all');
  const [docFilter, setDocFilter] = useState('all');
  const [docSearch, setDocSearch] = useState('');

  // Modals
  const [avisModalOpen, setAvisModalOpen] = useState(false);
  const [rapportModalOpen, setRapportModalOpen] = useState(false);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [reunionModalOpen, setReunionModalOpen] = useState(false);

  const advisorContext = {
      name: 'Conseiller Expert',
      commission: 'education',
      commissionName: 'Commission Éducation',
      expertise: 'Éducation et Formation'
  };

  // Real-time Listeners (Firestore)
  useEffect(() => {
    // We bind to real Firebase collections
    const unsubBoardMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubProjets = onSnapshot(query(collection(db, 'projets'), orderBy('createdAt', 'desc')), (snap) => setProjets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAvis = onSnapshot(query(collection(db, 'avis'), orderBy('date', 'desc')), (snap) => setAvis(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRapports = onSnapshot(query(collection(db, 'rapports'), orderBy('date', 'desc')), (snap) => setRapports(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPartners = onSnapshot(collection(db, 'partners'), (snap) => setPartenaires(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDocs = onSnapshot(query(collection(db, 'documents'), orderBy('date', 'desc')), (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMeetings = onSnapshot(query(collection(db, 'meetings'), where('commission', '==', advisorContext.commission)), (snap) => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    // For commission members, we could load users with role 'member' and specific commission, but let's mock the members display since it's informational and we don't have a commission_members col yet.
    setCommissionMembers([
        { id: 'cm1', nom: 'Sophie BISSOGUI', role: 'Présidente de Commission', email: 'sophie@email.com', telephone: '+236 70 00 00 04' },
        { id: 'cm2', nom: 'Jean DUPONT', role: 'Membre', email: 'jean@email.com', telephone: '+236 70 00 00 01' }
    ]);

    return () => { unsubAvis(); unsubRapports(); unsubPartners(); unsubDocs(); unsubMeetings(); unsubBoardMessages(); unsubProjets(); };
  }, []);

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
  };

  const handleLogout = async () => {
    if(window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        try { await signOut(auth); navigate('/'); } catch (err) { console.error('Logout error', err); }
    }
  };

  const pendingAvisCount = avis.filter(a => a.status === 'pending').length;
  const draftRapportsCount = rapports.filter(r => r.status === 'draft').length;
  const upcomingMeetingsCount = meetings.filter(m => m.status === 'upcoming').length;
  const totalNotifs = pendingAvisCount + upcomingMeetingsCount;

  // Forms Submissions
  const saveAvis = async (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
          title: (document.getElementById('avisTitle') as HTMLInputElement).value,
          context: (document.getElementById('avisContext') as HTMLSelectElement).value,
          content: (document.getElementById('avisContent') as HTMLTextAreaElement).value,
          recommendation: (document.getElementById('avisRecommendation') as HTMLTextAreaElement).value,
          priority: (document.getElementById('avisPriority') as HTMLSelectElement).value,
          status: 'pending',
          author: advisorContext.name,
          commission: advisorContext.commission,
          date: serverTimestamp()
      };
      await addDoc(collection(db, 'avis'), data);
      setAvisModalOpen(false);
      alert('✅ Avis soumis au Bureau Exécutif !');
  };

  const saveRapport = async (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
          title: (document.getElementById('rapportTitle') as HTMLInputElement).value,
          type: (document.getElementById('rapportType') as HTMLSelectElement).value,
          period: (document.getElementById('rapportPeriod') as HTMLInputElement).value,
          context: (document.getElementById('rapportContext') as HTMLTextAreaElement).value,
          content: (document.getElementById('rapportContent') as HTMLTextAreaElement).value,
          conclusion: (document.getElementById('rapportConclusion') as HTMLTextAreaElement).value,
          status: 'draft',
          author: advisorContext.name,
          commission: advisorContext.commission,
          date: serverTimestamp()
      };
      await addDoc(collection(db, 'rapports'), data);
      setRapportModalOpen(false);
      alert('📝 Rapport enregistré en brouillon.');
  };

  const savePartner = async (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
          name: (document.getElementById('partnerName') as HTMLInputElement).value,
          type: (document.getElementById('partnerType') as HTMLSelectElement).value,
          status: (document.getElementById('partnerStatus') as HTMLSelectElement).value,
          contact: (document.getElementById('partnerContact') as HTMLInputElement).value,
          email: (document.getElementById('partnerEmail') as HTMLInputElement).value,
          phone: (document.getElementById('partnerPhone') as HTMLInputElement).value,
          domain: (document.getElementById('partnerDomain') as HTMLSelectElement).value,
          description: (document.getElementById('partnerDescription') as HTMLTextAreaElement).value,
          addedBy: advisorContext.name,
          date: serverTimestamp() // using date for ordering
      };
      await addDoc(collection(db, 'partners'), data);
      setPartnerModalOpen(false);
  };

  const saveDocument = async (e: React.FormEvent) => {
      e.preventDefault();
      const tagsStr = (document.getElementById('docTags') as HTMLInputElement).value;
      const data = {
          title: (document.getElementById('docTitle') as HTMLInputElement).value,
          type: (document.getElementById('docType') as HTMLSelectElement).value,
          source: (document.getElementById('docSource') as HTMLInputElement).value,
          url: (document.getElementById('docUrl') as HTMLInputElement).value,
          summary: (document.getElementById('docSummary') as HTMLTextAreaElement).value,
          tags: tagsStr ? tagsStr.split(',').map(t => t.trim()) : [],
          addedBy: advisorContext.name,
          date: serverTimestamp()
      };
      await addDoc(collection(db, 'documents'), data);
      setDocumentModalOpen(false);
  };

  const saveReunion = async (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
          title: (document.getElementById('reunionTitle') as HTMLInputElement).value,
          date: new Date((document.getElementById('reunionDate') as HTMLInputElement).value),
          time: (document.getElementById('reunionTime') as HTMLInputElement).value,
          location: (document.getElementById('reunionLocation') as HTMLInputElement).value,
          agenda: (document.getElementById('reunionAgenda') as HTMLTextAreaElement).value,
          attendees: (document.getElementById('reunionAttendees') as HTMLTextAreaElement).value,
          commission: advisorContext.commission,
          status: 'upcoming',
          createdBy: advisorContext.name,
          createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'meetings'), data);
      setReunionModalOpen(false);
  };

  return (
    <div className="cons-dashboard-container">
        {/* HEADER */}
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
                    <button className="header-btn" onClick={() => setShowNotifPanel(!showNotifPanel)}>
                        🔔 {totalNotifs > 0 && <span className="notif-badge">{totalNotifs}</span>}
                    </button>
                    {showNotifPanel && (
                        <div style={{ position: 'absolute', top: '60px', right: '16px', width: '280px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 50, padding: '16px', color: '#1a1a1a' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>🔔 Notifications</h4>
                            {pendingAvisCount > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#B45309' }}>⚠️ {pendingAvisCount} avis en attente</div>}
                            {upcomingMeetingsCount > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#0A3D62' }}>📅 {upcomingMeetingsCount} réunion(s) à venir</div>}
                            {totalNotifs === 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#666' }}>Aucune notification.</div>}
                        </div>
                    )}
                    <button className="header-btn" onClick={handleLogout}>🚪</button>
                </div>
            </div>
            <div className="member-info-bar">
                <div className="member-avatar">💡</div>
                <div className="member-details">
                    <div className="member-name">Conseiller</div>
                    <div className="member-role">💡 Conseiller du Bureau Exécutif</div>
                </div>
                <div className="member-badge">Bureau</div>
            </div>
        </header>

        {/* TAB NAV (Desktop only conceptually, scrollable) */}
        <nav className="tab-nav" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '8px' }}>
            <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><span className="tab-icon">📊</span><span>Dashboard</span></button>
            <button className={`tab-btn ${activeTab === 'commission' ? 'active' : ''}`} onClick={() => setActiveTab('commission')}><span className="tab-icon">🏛️</span><span>Commission</span></button>
            <button className={`tab-btn ${activeTab === 'avis' ? 'active' : ''}`} onClick={() => setActiveTab('avis')}><span className="tab-icon">💡</span><span>Avis</span></button>
            <button className={`tab-btn ${activeTab === 'rapports' ? 'active' : ''}`} onClick={() => setActiveTab('rapports')}><span className="tab-icon">📄</span><span>Rapports</span></button>
            <button className={`tab-btn ${activeTab === 'partenaires' ? 'active' : ''}`} onClick={() => setActiveTab('partenaires')}><span className="tab-icon">🤝</span><span>Partenaires</span></button>
            <button className={`tab-btn ${activeTab === 'veille' ? 'active' : ''}`} onClick={() => setActiveTab('veille')}><span className="tab-icon">📚</span><span>Veille</span></button>
        </nav>

        {/* TAB: DASHBOARD */}
        <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <div className="welcome-card">
                <span className="role-badge">Conseiller</span>
                <h2>Bienvenue, Mr le Conseiller </h2>
                <p>Vous apportez votre expertise au Bureau Exécutif et participez aux commissions techniques.</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card" onClick={() => setActiveTab('avis')}>
                    <div className="stat-icon">💡</div><div className="stat-value">{avis.length}</div>
                    <div className="stat-label">Avis donnés</div><div className="stat-sublabel">{pendingAvisCount} en attente</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('rapports')}>
                    <div className="stat-icon">📄</div><div className="stat-value">{rapports.length}</div>
                    <div className="stat-label">Rapports</div><div className="stat-sublabel">{draftRapportsCount} brouillons</div>
                </div>
                <div className="stat-card success" onClick={() => setActiveTab('partenaires')}>
                    <div className="stat-icon">🤝</div><div className="stat-value">{partenaires.length}</div>
                    <div className="stat-label">Partenaires</div><div className="stat-sublabel">Actifs: {partenaires.filter(p => p.status === 'actif').length}</div>
                </div>
                <div className="stat-card alert" onClick={() => setActiveTab('commission')}>
                    <div className="stat-icon">📅</div><div className="stat-value">{upcomingMeetingsCount}</div>
                    <div className="stat-label">Réunions</div><div className="stat-sublabel">À venir</div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3 className="card-title">⚡ Actions rapides</h3></div>
                <div className="quick-actions">
                    <div className="quick-action" onClick={() => setAvisModalOpen(true)}><div className="qa-icon">💡</div><div className="qa-title">Donner un avis</div></div>
                    <div className="quick-action" onClick={() => setRapportModalOpen(true)}><div className="qa-icon">📄</div><div className="qa-title">Rapport commission</div></div>
                    <div className="quick-action" onClick={() => setActiveTab('partenaires')}><div className="qa-icon">🤝</div><div className="qa-title">Partenaires</div></div>
                    <div className="quick-action" onClick={() => setActiveTab('veille')}><div className="qa-icon">📚</div><div className="qa-title">Veille stratégique</div></div>
                    <div className="quick-action" onClick={() => setActiveTab('commission')}><div className="qa-icon">🏛️</div><div className="qa-title">Ma commission</div></div>
                    <div className="quick-action" onClick={() => setReunionModalOpen(true)}><div className="qa-icon">📅</div><div className="qa-title">Réunion</div></div>
                </div>
            </div>
        </div>

        {/* TAB: COMMISSION */}
        <div className={`tab-content ${activeTab === 'commission' ? 'active' : ''}`}>
            <div className="section-header"><h2>🏛️ Ma Commission Technique</h2><p>{advisorContext.commissionName}</p></div>
            
            <div className="card">
                <div className="card-header"><h3 className="card-title">👥 Membres de la Commission</h3></div>
                <div>
                    {commissionMembers.map(m => (
                        <div key={m.id} className="commission-member">
                            <div className="commission-avatar">{m.nom.substring(0,2)}</div>
                            <div className="commission-info">
                                <div className="commission-name">{m.nom}</div>
                                <div className="commission-role">{m.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">📅 Réunions de la Commission</h3>
                    <button className="btn btn-gold btn-small" onClick={() => setReunionModalOpen(true)}>➕ Planifier</button>
                </div>
                <div>
                    {meetings.length === 0 ? <div className="empty-state">Aucune réunion.</div> : 
                    meetings.map(m => (
                        <div key={m.id} className={`avis-item ${m.status === 'upcoming' ? 'pending' : 'approved'}`}>
                            <div className="avis-header">
                                <div className="avis-title">{m.title}</div>
                                <div className="avis-date">{formatDate(m.date)} à {m.time}</div>
                            </div>
                            <div className="avis-context">📍 {m.location}</div>
                            <div className="avis-content">{m.agenda}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* TAB: AVIS */}
        <div className={`tab-content ${activeTab === 'avis' ? 'active' : ''}`}>
            <div className="section-header"><h2>💡 Avis & Recommandations</h2><p>Vos contributions aux décisions du Bureau</p></div>
            <button className="btn btn-gold btn-block" onClick={() => setAvisModalOpen(true)} style={{ marginBottom: '16px' }}>💡 Donner un nouvel avis</button>
            <div className="sub-tabs">
                <button className={`sub-tab ${avisFilter === 'all' ? 'active' : ''}`} onClick={() => setAvisFilter('all')}>Tous</button>
                <button className={`sub-tab ${avisFilter === 'pending' ? 'active' : ''}`} onClick={() => setAvisFilter('pending')}>⏳ En attente</button>
                <button className={`sub-tab ${avisFilter === 'approved' ? 'active' : ''}`} onClick={() => setAvisFilter('approved')}>✅ Approuvés</button>
            </div>
            <div>
                {avis.filter(a => avisFilter === 'all' || a.status === avisFilter).map(a => (
                    <div key={a.id} className={`avis-item ${a.status}`}>
                        <div className="avis-header">
                            <div className="avis-title">{a.title}</div>
                            <div className="avis-date">{formatDate(a.date)}</div>
                        </div>
                        <div className="avis-context">Domaine: {a.context}</div>
                        <div className="avis-content">{a.content}</div>
                        <div className="avis-recommendation">💡 <strong>Recommandation:</strong> {a.recommendation}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* TAB: RAPPORTS */}
        <div className={`tab-content ${activeTab === 'rapports' ? 'active' : ''}`}>
            <div className="section-header"><h2>📄 Rapports de Commission</h2></div>
            <button className="btn btn-gold btn-block" onClick={() => setRapportModalOpen(true)} style={{ marginBottom: '16px' }}>📝 Rédiger un rapport</button>
            <div className="sub-tabs">
                <button className={`sub-tab ${rapportFilter === 'all' ? 'active' : ''}`} onClick={() => setRapportFilter('all')}>Tous</button>
                <button className={`sub-tab ${rapportFilter === 'activite' ? 'active' : ''}`} onClick={() => setRapportFilter('activite')}>📊 Activités</button>
            </div>
            <div>
                {rapports.filter(r => rapportFilter === 'all' || r.type === rapportFilter).map(r => (
                    <div key={r.id} className="document-item">
                        <div className="document-icon">📄</div>
                        <div className="document-info">
                            <div className="document-title">{r.title}</div>
                            <div className="document-meta">{r.type} • {r.period || '-'} • {formatDate(r.date)}</div>
                            <div style={{ marginTop: '4px' }}>
                                {r.status === 'draft' ? <span className="badge badge-warning">Brouillon</span> : <span className="badge badge-success">Soumis</span>}
                            </div>
                        </div>
                        <button className="btn btn-primary btn-small">👁️</button>
                    </div>
                ))}
            </div>
        </div>

        {/* TAB: PARTNERS */}
        <div className={`tab-content ${activeTab === 'partenaires' ? 'active' : ''}`}>
            <div className="section-header"><h2>🤝 Partenaires Institutionnels</h2></div>
            <button className="btn btn-gold btn-block" onClick={() => setPartnerModalOpen(true)} style={{ marginBottom: '16px' }}>➕ Ajouter un partenaire</button>
            <div className="sub-tabs">
                <button className={`sub-tab ${partnerFilter === 'all' ? 'active' : ''}`} onClick={() => setPartnerFilter('all')}>Tous</button>
                <button className={`sub-tab ${partnerFilter === 'actif' ? 'active' : ''}`} onClick={() => setPartnerFilter('actif')}>✅ Actifs</button>
                <button className={`sub-tab ${partnerFilter === 'prospect' ? 'active' : ''}`} onClick={() => setPartnerFilter('prospect')}>🎯 Prospects</button>
            </div>
            <div>
                {partenaires.filter(p => partnerFilter === 'all' || p.status === partnerFilter).map(p => (
                    <div key={p.id} className="partner-item">
                        <div className="partner-logo">🏛️</div>
                        <div className="partner-info">
                            <div className="partner-name">{p.name}</div>
                            <div className="partner-type">{p.contact}</div>
                            <div className="partner-status">
                                {p.status === 'actif' ? <span className="badge badge-success">Actif</span> : <span className="badge badge-warning">Prospect</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* TAB: VEILLE (DOCUMENTS) */}
        <div className={`tab-content ${activeTab === 'veille' ? 'active' : ''}`}>
            <div className="section-header"><h2>📚 Veille Stratégique</h2></div>
            <button className="btn btn-gold btn-block" onClick={() => setDocumentModalOpen(true)} style={{ marginBottom: '16px' }}>📤 Ajouter une ressource</button>
            <div className="sub-tabs">
                <button className={`sub-tab ${docFilter === 'all' ? 'active' : ''}`} onClick={() => setDocFilter('all')}>Tous</button>
                <button className={`sub-tab ${docFilter === 'article' ? 'active' : ''}`} onClick={() => setDocFilter('article')}>📰 Articles</button>
            </div>
            <div>
                {documents.filter(d => (docFilter === 'all' || d.type === docFilter) && d.title.toLowerCase().includes(docSearch.toLowerCase())).map(d => (
                    <div key={d.id} className="document-item">
                        <div className="document-icon">📚</div>
                        <div className="document-info">
                            <div className="document-title">{d.title}</div>
                            <div className="document-meta">{d.type} • {d.source || '-'}</div>
                            <div className="document-meta" style={{ marginTop: '2px' }}>{d.summary ? d.summary.substring(0, 80) + '...' : ''}</div>
                        </div>
                        {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-small">🔗</a>}
                    </div>
                ))}
            </div>
        </div>

        {/* BOTTOM NAV (MOBILE FIRST) */}
        <nav className="bottom-nav" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
            <button style={{ minWidth: '80px', flex: '0 0 auto' }} className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><span className="nav-icon">📊</span><span>Dash</span></button>
            <button className={activeTab === 'commission' ? 'active' : ''} onClick={() => setActiveTab('commission')}><span className="nav-icon">🏛️</span><span>Com.</span></button>
            <button className={activeTab === 'avis' ? 'active' : ''} onClick={() => setActiveTab('avis')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💡</span><span>Avis</span></button>
          <button className={activeTab === 'projets' ? 'active' : ''} onClick={() => setActiveTab('projets')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">📈</span><span>Projets</span></button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💬</span><span>Messages</span></button>
            <button className={activeTab === 'partenaires' ? 'active' : ''} onClick={() => setActiveTab('partenaires')}><span className="nav-icon">🤝</span><span>Partenaires</span></button>
        </nav>

        {/* MODALS */}
        {avisModalOpen && (
            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modal-content" style={{ width: '90%', maxWidth: '500px' }}>
                    <div className="modal-header"><h3>Donner un Avis</h3><button className="modal-close" onClick={() => setAvisModalOpen(false)}>✕</button></div>
                    <form onSubmit={saveAvis}>
                        <div className="form-group"><label>Sujet</label><input type="text" id="avisTitle" required /></div>
                        <div className="form-group"><label>Contexte</label><select id="avisContext"><option value="budget">Budget</option><option value="strategie">Stratégie</option><option value="autre">Autre</option></select></div>
                        <div className="form-group"><label>Analyse</label><textarea id="avisContent" required rows={3}></textarea></div>
                        <div className="form-group"><label>Recommandation</label><textarea id="avisRecommendation" required rows={2}></textarea></div>
                        <div className="form-group"><label>Priorité</label><select id="avisPriority"><option value="normal">Normal</option><option value="important">Important</option></select></div>
                        <button type="submit" className="btn btn-gold btn-block">Soumettre</button>
                    </form>
                </div>
            </div>
        )}

        {rapportModalOpen && (
            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modal-content" style={{ width: '90%', maxWidth: '500px' }}>
                    <div className="modal-header"><h3>Nouveau Rapport</h3><button className="modal-close" onClick={() => setRapportModalOpen(false)}>✕</button></div>
                    <form onSubmit={saveRapport}>
                        <div className="form-group"><label>Titre</label><input type="text" id="rapportTitle" required /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Type</label><select id="rapportType"><option value="activite">Activité</option><option value="recommandation">Recommandation</option></select></div>
                            <div className="form-group"><label>Période</label><input type="text" id="rapportPeriod" /></div>
                        </div>
                        <div className="form-group"><label>Contexte</label><textarea id="rapportContext" required rows={2}></textarea></div>
                        <div className="form-group"><label>Contenu</label><textarea id="rapportContent" required rows={3}></textarea></div>
                        <div className="form-group"><label>Conclusion</label><textarea id="rapportConclusion" required rows={2}></textarea></div>
                        <button type="submit" className="btn btn-gold btn-block">Enregistrer le brouillon</button>
                    </form>
                </div>
            </div>
        )}

        {partnerModalOpen && (
            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modal-content" style={{ width: '90%', maxWidth: '500px' }}>
                    <div className="modal-header"><h3>Ajouter Partenaire</h3><button className="modal-close" onClick={() => setPartnerModalOpen(false)}>✕</button></div>
                    <form onSubmit={savePartner}>
                        <div className="form-group"><label>Nom</label><input type="text" id="partnerName" required /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Type</label><select id="partnerType"><option value="institutionnel">Institutionnel</option><option value="ong">ONG</option></select></div>
                            <div className="form-group"><label>Statut</label><select id="partnerStatus"><option value="prospect">Prospect</option><option value="actif">Actif</option></select></div>
                        </div>
                        <div className="form-group"><label>Contact (Nom)</label><input type="text" id="partnerContact" /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Email</label><input type="email" id="partnerEmail" /></div>
                            <div className="form-group"><label>Téléphone</label><input type="tel" id="partnerPhone" /></div>
                        </div>
                        <div className="form-group"><label>Domaine</label><select id="partnerDomain"><option value="education">Éducation</option></select></div>
                        <div className="form-group"><label>Description</label><textarea id="partnerDescription" rows={2}></textarea></div>
                        <button type="submit" className="btn btn-gold btn-block">Enregistrer</button>
                    </form>
                </div>
            </div>
        )}

        {documentModalOpen && (
            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modal-content" style={{ width: '90%', maxWidth: '500px' }}>
                    <div className="modal-header"><h3>Ajouter Ressource</h3><button className="modal-close" onClick={() => setDocumentModalOpen(false)}>✕</button></div>
                    <form onSubmit={saveDocument}>
                        <div className="form-group"><label>Titre</label><input type="text" id="docTitle" required /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Type</label><select id="docType"><option value="article">Article</option><option value="etude">Étude</option></select></div>
                            <div className="form-group"><label>Source</label><input type="text" id="docSource" /></div>
                        </div>
                        <div className="form-group"><label>URL</label><input type="url" id="docUrl" /></div>
                        <div className="form-group"><label>Résumé</label><textarea id="docSummary" required rows={2}></textarea></div>
                        <div className="form-group"><label>Tags (virgule)</label><input type="text" id="docTags" /></div>
                        <button type="submit" className="btn btn-gold btn-block">Enregistrer</button>
                    </form>
                </div>
            </div>
        )}

        {reunionModalOpen && (
            <div className="modal active" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="modal-content" style={{ width: '90%', maxWidth: '500px' }}>
                    <div className="modal-header"><h3>Planifier Réunion</h3><button className="modal-close" onClick={() => setReunionModalOpen(false)}>✕</button></div>
                    <form onSubmit={saveReunion}>
                        <div className="form-group"><label>Titre</label><input type="text" id="reunionTitle" required /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Date</label><input type="date" id="reunionDate" required /></div>
                            <div className="form-group"><label>Heure</label><input type="time" id="reunionTime" required /></div>
                        </div>
                        <div className="form-group"><label>Lieu</label><input type="text" id="reunionLocation" required /></div>
                        <div className="form-group"><label>Ordre du jour</label><textarea id="reunionAgenda" required rows={3}></textarea></div>
                        <div className="form-group"><label>Participants (optionnel)</label><textarea id="reunionAttendees" rows={2}></textarea></div>
                        <button type="submit" className="btn btn-gold btn-block">Planifier</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
