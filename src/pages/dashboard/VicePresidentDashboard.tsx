import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import './VicePresidentDashboard.css';

export const VicePresidentDashboard = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab: string) => setSearchParams({ tab });
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Filters
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [meetingFilter, setMeetingFilter] = useState('all');
  const [contentSection, setContentSection] = useState('news');

  // Modals
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: () => {} });

  // Data State
  const [members, setMembers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [missionsBenevolat, setMissionsBenevolat] = useState<any[]>([]);
  const [missionModalOpen, setMissionModalOpen] = useState(false);
  const [suppleanceHistory, setSuppleanceHistory] = useState<any[]>([]);
  const [isSuppleanceActive, setIsSuppleanceActive] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [conflits, setConflits] = useState<any[]>([]);
  const [partenaires, setPartenaires] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Computed Stats
  const pendingApprovals = members.filter(m => m.statut === 'en_attente').length;
  const upcomingMeetings = meetings.filter(m => m.statut === 'upcoming').length;
  const publishedNewsCount = news.filter(n => n.status === 'publie').length;
  const urgentTasks = tasks.filter(t => !t.completed && t.priority === 'urgente').length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const pendingExpensesCount = expenses.filter(e => e.status === 'pending' || e.statut === 'pending').length;

  // Domain Stats placeholder
  const domainStats = [
    { name: 'Éducation', count: 12, color: 'var(--orange-energie)' },
    { name: 'Santé', count: 8, color: 'var(--rouge-solidarite)' },
    { name: 'Agriculture', count: 15, color: 'var(--vert-espoir)' },
    { name: 'Juridique', count: 5, color: 'var(--violet-dignite)' },
    { name: 'Humanitaire', count: 10, color: 'var(--rouge-solidarite)' },
    { name: 'Jeunesse', count: 7, color: 'var(--violet-dignite)' }
  ];
  const maxDomainCount = Math.max(...domainStats.map(d => d.count));

  // Reports placeholder
  const reportsList = [
    { icon: '📊', title: 'Rapport d\'activités T3 2026', meta: 'PDF • 2.4 MB • 15 Sept 2026' },
    { icon: '💰', title: 'Rapport financier T3 2026', meta: 'PDF • 1.2 MB • 15 Sept 2026' },
    { icon: '📋', title: 'PV AG Juin 2026', meta: 'PDF • 800 KB • 20 Juin 2026' },
    { icon: '📜', title: 'Statuts de l\'Association', meta: 'PDF • 500 KB • 13 Juillet 2025' }
  ];

  // Real-time Listeners
  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'users'), (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMeetings = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc')), (snap) => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc')), (snap) => setNews(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDomains = onSnapshot(query(collection(db, 'domains'), orderBy('order', 'asc')), (snap) => setDomains(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (docSnap) => { if (docSnap.exists()) setSiteConfig(docSnap.data()); });
    const unsubMissions = onSnapshot(query(collection(db, 'missions_benevolat'), orderBy('createdAt', 'desc')), (snap) => {
        setMissionsBenevolat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), (snap) => {
      // sort client side or use index
      let t = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      t.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setTasks(t);
    });
    const unsubSuppleance = onSnapshot(query(collection(db, 'suppleance_history'), orderBy('date', 'desc')), (snap) => {
      setSuppleanceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubSuppleanceState = onSnapshot(doc(db, 'system', 'suppleance'), (docSnap) => {
      if (docSnap.exists()) setIsSuppleanceActive(docSnap.data().active || false);
    });
    const unsubObjectives = onSnapshot(query(collection(db, 'objectives'), orderBy('createdAt', 'desc')), (snap) => {
      setObjectives(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubConflits = onSnapshot(query(collection(db, 'conflits'), orderBy('createdAt', 'desc')), (snap) => {
      setConflits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubPartenaires = onSnapshot(query(collection(db, 'partenaires'), orderBy('createdAt', 'desc')), (snap) => {
      setPartenaires(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCommissions = onSnapshot(query(collection(db, 'commissions'), orderBy('name', 'asc')), (snap) => {
      setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubBoardMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => {
      setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubMembers(); unsubMeetings(); unsubNews(); unsubDomains(); unsubConfig(); unsubTasks(); unsubSuppleance(); unsubSuppleanceState(); unsubObjectives(); unsubConflits(); unsubPartenaires(); unsubCommissions(); unsubBoardMessages(); unsubExpenses(); unsubMissions(); };
  }, []);

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
  };

  const confirmAction = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, message, onConfirm });
  };

  const handleLogout = async () => {
    confirmAction('🚪 Êtes-vous sûr de vouloir vous déconnecter ?', async () => {
      try { await signOut(auth); navigate('/'); } catch (err) { console.error('Logout error', err); }
    });
  };

  const signExpense = (id: string) => {
    confirmAction('✍️ Signer cette dépense (Suppléance) ?\n\nArt. 15/16 Statuts: Le Vice-Président supplée le Président pour la cosignature.', async () => {
        await updateDoc(doc(db, 'transactions', id), {
            statut: 'signed',
            presidentSignature: true,
            signedAt: serverTimestamp(),
            signedBy: 'vice_president_suppleant'
        });
        await updateDoc(doc(db, 'expenses', id), {
            status: 'signed',
            statut: 'signed',
            presidentSignature: true
        });
    });
  };

  // MEMBERS ACTIONS
  const filteredMembers = members.filter(m => {
    const searchMatch = !memberSearch || (m.nom?.toLowerCase() || '').includes(memberSearch.toLowerCase()) || (m.email?.toLowerCase() || '').includes(memberSearch.toLowerCase());
    if (!searchMatch) return false;
    if (memberFilter === 'all') return true;
    if (memberFilter === 'en_attente') return m.statut === 'en_attente';
    if (memberFilter === 'actif') return m.categorie === 'actif' && m.statut === 'a_jour';
    if (memberFilter === 'bienfaiteur') return m.categorie === 'bienfaiteur';
    if (memberFilter === 'en_retard') return m.statut === 'en_retard';
    return true;
  });

  const approveMember = (id: string, isRequest: boolean) => {
    confirmAction('✓ Approuver ce membre ?', async () => {
        const coll = isRequest ? 'membership_requests' : 'members';
        await updateDoc(doc(db, coll, id), { statut: 'a_jour', approvedAt: serverTimestamp(), approvedBy: 'vice_president' });
    });
  };

  const rejectMember = (id: string, isRequest: boolean) => {
      confirmAction('✕ Refuser ce membre ?', async () => {
        const coll = isRequest ? 'membership_requests' : 'members';
        await updateDoc(doc(db, coll, id), { statut: 'refuse', rejectedAt: serverTimestamp() });
      });
  };

  // MEETINGS ACTIONS
  const filteredMeetings = meetings.filter(m => {
    if (meetingFilter === 'all') return true;
    if (meetingFilter === 'upcoming') return m.statut === 'upcoming';
    if (meetingFilter === 'bureau') return m.type === 'bureau';
    if (meetingFilter === 'ag') return m.type?.startsWith('ag');
    return true;
  });

  const saveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = (document.getElementById('meetingType') as HTMLSelectElement).value;
    const date = new Date((document.getElementById('meetingDate') as HTMLInputElement).value);
    const data = {
        type, date,
        heure: (document.getElementById('meetingTime') as HTMLInputElement).value,
        lieu: (document.getElementById('meetingLocation') as HTMLInputElement).value,
        agenda: (document.getElementById('meetingAgenda') as HTMLTextAreaElement).value,
        statut: 'upcoming', convoquePar: 'vice_president',
        titre: `${type === 'bureau' ? 'Réunion Bureau' : type === 'ag_ordinaire' ? 'AG Ordinaire' : 'AG Extraordinaire'} - ${formatDate(date)}`,
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'meetings'), data);
    setMeetingModalOpen(false);
  };

  const completeMeeting = (id: string) => {
      confirmAction('✓ Marquer cette réunion comme terminée ?', async () => {
        await updateDoc(doc(db, 'meetings', id), { statut: 'completed', completedAt: serverTimestamp() });
      });
  };

  // CONTENT ACTIONS
  const publishNews = (id: string) => {
    confirmAction('🚀 Publier cette actualité sur le site public ?', async () => {
        await updateDoc(doc(db, 'news', id), { status: 'publie', publishedAt: serverTimestamp() });
    });
  };

  const removeNews = (id: string) => {
    confirmAction('️ Supprimer cette actualité définitivement ?', async () => {
        await deleteDoc(doc(db, 'news', id));
    });
  };

  const saveSiteConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
        heroTitle: (document.getElementById('cfgHeroTitle') as HTMLInputElement).value,
        heroSubtitle: (document.getElementById('cfgHeroSubtitle') as HTMLTextAreaElement).value,
        aboutHistory: (document.getElementById('cfgHistory') as HTMLTextAreaElement).value,
        aboutMission: (document.getElementById('cfgMission') as HTMLTextAreaElement).value,
        contactAddress: (document.getElementById('cfgAddress') as HTMLInputElement).value,
        contactPhone1: (document.getElementById('cfgPhone1') as HTMLInputElement).value,
        contactPhone2: (document.getElementById('cfgPhone2') as HTMLInputElement).value,
        contactEmail: (document.getElementById('cfgEmail') as HTMLInputElement).value,
        updatedAt: serverTimestamp(), updatedBy: 'vice_president'
    };
    await setDoc(doc(db, 'site_config', 'main'), config, { merge: true });
    alert('✅ Configuration sauvegardée !');
  };

  // TASKS ACTIONS
  
  const saveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateInput = (document.getElementById('missionDate') as HTMLInputElement).value;
    const reqVol = (document.getElementById('missionVolunteers') as HTMLInputElement).value;
    const data = {
        title: (document.getElementById('missionTitle') as HTMLInputElement).value,
        description: (document.getElementById('missionDescription') as HTMLTextAreaElement).value,
        location: (document.getElementById('missionLocation') as HTMLInputElement).value,
        date: dateInput ? new Date(dateInput) : null,
        requiredVolunteers: reqVol ? parseInt(reqVol) : 0,
        participants: [],
        status: 'ouverte',
        createdBy: 'vice_president',
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'missions_benevolat'), data);
    setMissionModalOpen(false);
  };


  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const dl = (document.getElementById('taskDeadline') as HTMLInputElement).value;
    const assigned = (document.getElementById('taskAssignedTo') as HTMLSelectElement)?.value || 'vice_president';
    const data = {
        title: (document.getElementById('taskTitle') as HTMLInputElement).value,
        description: (document.getElementById('taskDescription') as HTMLTextAreaElement).value,
        priority: (document.getElementById('taskPriority') as HTMLSelectElement).value,
        deadline: dl ? new Date(dl) : null,
        completed: false, 
        assignedTo: assigned,
        createdBy: 'vice_president',
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'tasks'), data);
    setTaskModalOpen(false);
  };

  const toggleTask = async (id: string, currentCompleted: boolean) => {
    await updateDoc(doc(db, 'tasks', id), {
        completed: !currentCompleted,
        completedAt: !currentCompleted ? serverTimestamp() : null
    });
  };

  const deleteTask = (id: string) => {
    confirmAction('️ Supprimer cette tâche ?', async () => {
        await deleteDoc(doc(db, 'tasks', id));
    });
  };

  // SUPPLEANCE ACTIONS
  const activateSuppleance = async () => {
    const raison = prompt('Motif de la suppléance (absence du Président) :');
    if (!raison) return;
    const duree = prompt('Durée estimée de la suppléance :');
    if (!duree) return;

    try {
        await setDoc(doc(db, 'system', 'suppleance'), { active: true, raison, duree, activatedAt: serverTimestamp() });
        await addDoc(collection(db, 'suppleance_history'), {
            date: new Date(),
            raison, duree,
            actions: 'Suppléance activée',
            activatedBy: 'vice_president',
            createdAt: serverTimestamp()
        });
        alert('⚡ Mode suppléance activé ! Le Président et le Bureau ont été notifiés.');
    } catch (e) {
        console.error(e);
    }
  };

  const toggleSuppleance = async () => {
      confirmAction('Désactiver le mode suppléance ?', async () => {
          await setDoc(doc(db, 'system', 'suppleance'), { active: false, deactivatedAt: serverTimestamp() }, { merge: true });
          alert('Mode suppléance désactivé.');
      });
  };

  return (
    <div className="vp-dashboard-container">
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
                <div style={{ position: 'relative' }}>
                    <button className="header-btn" onClick={() => setShowNotifPanel(!showNotifPanel)} aria-label="Notifications">
                        🔔 {(pendingApprovals + urgentTasks) > 0 && <span className="notif-badge">{pendingApprovals + urgentTasks}</span>}
                    </button>
                    {showNotifPanel && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '280px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 50, padding: '16px', color: '#1a1a1a' }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>🔔 Notifications</h4>
                            {pendingApprovals > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { setActiveTab('members'); setShowNotifPanel(false); }}><span style={{ fontSize: '16px' }}>⏳</span><span>{pendingApprovals} adhésion(s) en attente</span></div>}
                            {urgentTasks > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#C62828', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { setActiveTab('dashboard'); setShowNotifPanel(false); }}><span style={{ fontSize: '16px' }}>⚡</span><span>{urgentTasks} tâche(s) urgente(s)</span></div>}
                            {pendingApprovals === 0 && urgentTasks === 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#666' }}>Aucune action urgente.</div>}
                        </div>
                    )}
                </div>
                <button className="header-btn" onClick={handleLogout} aria-label="Déconnexion" title="Déconnexion">🚪</button>
            </div>
        </div>
        </header>

    {/* TAB NAVIGATION */}
    <nav className="tab-nav">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><span className="tab-icon">🏠</span><span>Dashboard</span></button>
        <button className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => setActiveTab('commissions')}><span className="tab-icon">🏛️</span><span>Commissions</span></button>
        <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}><span className="tab-icon">📋</span><span>Tâches</span></button>
        <button className={`tab-btn ${activeTab === 'objectives' ? 'active' : ''}`} onClick={() => setActiveTab('objectives')}><span className="tab-icon">🎯</span><span>Objectifs</span></button>
        <button className={`tab-btn ${activeTab === 'partenaires' ? 'active' : ''}`} onClick={() => setActiveTab('partenaires')}><span className="tab-icon">🤝</span><span>Partenaires</span></button>
        <button className={`tab-btn ${activeTab === 'conflits' ? 'active' : ''}`} onClick={() => setActiveTab('conflits')}><span className="tab-icon">⚖️</span><span>Conflits</span></button>
        <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}><span className="tab-icon">💬</span><span>Messages</span></button>
        <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}><span className="tab-icon">👥</span><span>Membres</span></button>
        <button className={`tab-btn ${activeTab === 'meetings' ? 'active' : ''}`} onClick={() => setActiveTab('meetings')}><span className="tab-icon">📅</span><span>Réunions</span></button>
        <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}><span className="tab-icon">📝</span><span>Contenu</span></button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}><span className="tab-icon">📊</span><span>Rapports</span></button>
        <button className={`tab-btn ${activeTab === 'suppleance' ? 'active' : ''}`} onClick={() => setActiveTab('suppleance')}><span className="tab-icon">⚡</span><span>Suppléance</span></button>
        {isSuppleanceActive && (
            <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}><span className="tab-icon">💰</span><span>Dépenses (Suppléance)</span></button>
        )}
    </nav>

    {isSuppleanceActive && (
        <div className="suppleance-banner" style={{ margin: '16px' }}>
            <h3>⚡ Mode Suppléance Actif</h3>
            <p>Vous remplacez le Président en son absence. Vous avez accès à toutes ses fonctionnalités.</p>
            <div className="suppleance-toggle">
                <button className="btn btn-secondary btn-small" onClick={toggleSuppleance}>Désactiver le mode suppléance</button>
            </div>
        </div>
    )}

    {/* TAB 1: DASHBOARD */}
    <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
        <div className="welcome-card">
            <span className="role-badge"> Vice-Président</span>
            <h2>Bienvenue, Mr le Vice-Président {userData?.nom || userData?.displayName || ''}</h2>
            <p>Vous assistez le Président dans la coordination des activités de l'association.</p>
        </div>

        <div className="stats-grid">
            <div className="stat-card" onClick={() => setActiveTab('members')}>
                <div className="stat-icon">👥</div>
                <div className="stat-value">{members.length}</div>
                <div className="stat-label">Membres</div>
                <div className="stat-sublabel">{pendingApprovals} en attente</div>
            </div>
            <div className={`stat-card ${upcomingMeetings > 0 ? 'alert' : ''}`} onClick={() => setActiveTab('meetings')}>
                <div className="stat-icon">📋</div>
                <div className="stat-value">{upcomingMeetings}</div>
                <div className="stat-label">Réunions</div>
                <div className="stat-sublabel">À venir</div>
            </div>
            <div className="stat-card success" onClick={() => setActiveTab('content')}>
                <div className="stat-icon">📰</div>
                <div className="stat-value">{publishedNewsCount}</div>
                <div className="stat-label">Actualités</div>
                <div className="stat-sublabel">Publiées</div>
            </div>
            <div className={`stat-card ${urgentTasks > 0 ? 'alert' : ''}`}>
                <div className="stat-icon">📊</div>
                <div className="stat-value">{pendingTasks}</div>
                <div className="stat-label">Tâches</div>
                <div className="stat-sublabel">En cours</div>
            </div>
        </div>

        <div>
            {pendingApprovals > 0 && (
                <div className="alert-box warning">
                    <div className="alert-icon">⏳</div>
                    <div className="alert-content">
                        <h4>{pendingApprovals} adhésion(s) en attente</h4>
                        <p>Approuvez ou refusez les nouvelles demandes d'adhésion.</p>
                    </div>
                    <button className="btn btn-outline btn-small" onClick={() => setActiveTab('members')}>Voir →</button>
                </div>
            )}
            {upcomingMeetings > 0 && (
                <div className="alert-box info">
                    <div className="alert-icon">📋</div>
                    <div className="alert-content">
                        <h4>{upcomingMeetings} réunion(s) à venir</h4>
                        <p>Vérifiez les convocations et l'ordre du jour.</p>
                    </div>
                    <button className="btn btn-outline btn-small" onClick={() => setActiveTab('meetings')}>Voir →</button>
                </div>
            )}
            {urgentTasks > 0 && (
                <div className="alert-box danger">
                    <div className="alert-icon">⚡</div>
                    <div className="alert-content">
                        <h4>{urgentTasks} tâche(s) urgente(s)</h4>
                        <p>Des tâches prioritaires nécessitent votre attention.</p>
                    </div>
                </div>
            )}
        </div>

        <div className="card">
            <div className="card-header">
                <h3 className="card-title">⚡ Actions rapides</h3>
            </div>
            <div className="quick-actions">
                <div className="quick-action" onClick={() => setActiveTab('members')}><div className="qa-icon">👥</div><div className="qa-title">Gérer les membres</div></div>
                <div className="quick-action" onClick={() => { setActiveTab('meetings'); setMeetingModalOpen(true); }}><div className="qa-icon">📋</div><div className="qa-title">Convoquer réunion</div></div>
                <div className="quick-action" onClick={() => setActiveTab('content')}><div className="qa-icon">📝</div><div className="qa-title">Contenu public</div></div>
                <div className="quick-action" onClick={() => setActiveTab('reports')}><div className="qa-icon">📊</div><div className="qa-title">Rapports</div></div>
                <div className="quick-action" onClick={() => setActiveTab('suppleance')}><div className="qa-icon">⚡</div><div className="qa-title">Mode suppléance</div></div>
                <div className="quick-action" onClick={() => setTaskModalOpen(true)}><div className="qa-icon">📝</div><div className="qa-title">Nouvelle tâche</div></div>
            </div>
        </div>

        <div className="card">
            <div className="card-header">
                <h3 className="card-title">📝 Mes tâches de coordination</h3>
                <button className="btn btn-gold btn-small" onClick={() => setTaskModalOpen(true)}>➕ Ajouter</button>
            </div>
            <div>
                {tasks.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📝</div><h3>Aucune tâche</h3></div>
                ) : (
                    tasks.map(t => (
                        <div key={t.id} className={`task-item ${t.priority === 'urgente' ? 'urgent' : ''} ${t.completed ? 'completed' : ''}`}>
                            <div className={`task-checkbox ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t.id, t.completed)}>{t.completed ? '✓' : ''}</div>
                            <div className="task-content">
                                <div className="task-title" style={{ textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</div>
                                <div className="task-meta">{t.description || ''} {t.deadline ? '• Échéance: ' + formatDate(t.deadline) : ''}</div>
                            </div>
                            <button className="btn btn-danger btn-small" onClick={() => deleteTask(t.id)}>🗑️</button>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="card">
            <div className="card-header"><h3 className="card-title">📜 Rappels Statutaires</h3></div>
            <ul style={{ fontSize: '14px', paddingLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Art. 13 Statuts :</strong> Assister le Président dans ses fonctions</li>
                <li><strong>Art. 15 RI :</strong> Remplacer le Président en cas d'absence</li>
                <li><strong>Art. 14 RI :</strong> Le Bureau se réunit au moins une fois par mois</li>
            </ul>
        </div>
    </div>

    {/* TAB 2: MEMBRES */}
    <div className={`tab-content ${activeTab === 'members' ? 'active' : ''}`}>
        <div className="section-header"><h2>👥 Gestion des Membres</h2><p>{members.length} membre(s) au total</p></div>
        <div className="sub-tabs">
            <button className={`sub-tab ${memberFilter === 'all' ? 'active' : ''}`} onClick={() => setMemberFilter('all')}>Tous</button>
            <button className={`sub-tab ${memberFilter === 'en_attente' ? 'active' : ''}`} onClick={() => setMemberFilter('en_attente')}>⏳ En attente</button>
            <button className={`sub-tab ${memberFilter === 'actif' ? 'active' : ''}`} onClick={() => setMemberFilter('actif')}>✅ Actifs</button>
            <button className={`sub-tab ${memberFilter === 'bienfaiteur' ? 'active' : ''}`} onClick={() => setMemberFilter('bienfaiteur')}>💛 Bienfaiteurs</button>
        </div>
        <div className="filters-bar"><input type="text" className="search-input" placeholder="Rechercher un membre..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} /></div>
        <div>
            {filteredMembers.length === 0 ? <div className="empty-state"><div className="empty-icon">👥</div><h3>Aucun membre trouvé</h3></div> : (
                filteredMembers.map(m => (
                    <div key={m.id} className="member-item">
                        <div className="member-item-header">
                            <div className="member-avatar-small">{m.nom?.substring(0,2).toUpperCase() || 'IK'}</div>
                            <div className="member-info">
                                <div className="member-name-text">{m.nom || 'Sans nom'}</div>
                                <div className="member-meta">{m.email || m.telephone || '-'}</div>
                                <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
                                    <span className="badge badge-info">{m.categorie || 'actif'}</span>
                                    {m.statut === 'a_jour' && <span className="badge badge-success">✓ À jour</span>}
                                    {m.statut === 'en_attente' && <span className="badge badge-warning">⏳ En attente</span>}
                                    {m.statut === 'en_retard' && <span className="badge badge-danger">⚠️ En retard</span>}
                                </div>
                            </div>
                        </div>
                        <div className="member-actions">
                            {m.statut === 'en_attente' ? (
                                <>
                                    <button className="btn btn-success btn-small" onClick={() => approveMember(m.id, !!m.isRequest)}>✓ Approuver</button>
                                    <button className="btn btn-danger btn-small" onClick={() => rejectMember(m.id, !!m.isRequest)}>✕ Refuser</button>
                                </>
                            ) : (
                                <button className="btn btn-outline btn-small" onClick={() => alert(`👤 ${m.nom}\n📧 ${m.email}\n📞 ${m.telephone}`)}>👁️ Voir</button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>

    {/* TAB 3: RÉUNIONS */}
    <div className={`tab-content ${activeTab === 'meetings' ? 'active' : ''}`}>
        <div className="section-header"><h2>📋 Réunions & Assemblées Générales</h2></div>
        <button className="btn btn-gold btn-block" onClick={() => setMeetingModalOpen(true)} style={{ marginBottom: '16px' }}>➕ Convoquer une réunion</button>
        <div className="sub-tabs">
            <button className={`sub-tab ${meetingFilter === 'all' ? 'active' : ''}`} onClick={() => setMeetingFilter('all')}>Toutes</button>
            <button className={`sub-tab ${meetingFilter === 'upcoming' ? 'active' : ''}`} onClick={() => setMeetingFilter('upcoming')}>📅 À venir</button>
            <button className={`sub-tab ${meetingFilter === 'bureau' ? 'active' : ''}`} onClick={() => setMeetingFilter('bureau')}>👔 Bureau</button>
            <button className={`sub-tab ${meetingFilter === 'ag' ? 'active' : ''}`} onClick={() => setMeetingFilter('ag')}>🏛️ AG</button>
        </div>
        <div>
            {filteredMeetings.length === 0 ? <div className="empty-state"><div className="empty-icon">📋</div><h3>Aucune réunion</h3></div> : (
                filteredMeetings.map(m => {
                    const typeLabels: Record<string, string> = { bureau: '👔 Bureau', ag_ordinaire: '🏛️ AG Ordinaire', ag_extraordinaire: '⚡ AG Extraordinaire' };
                    return (
                        <div key={m.id} className={`meeting-item ${m.statut === 'upcoming' ? 'upcoming' : ''} ${m.type === 'ag_extraordinaire' ? 'urgent' : ''}`}>
                            <div className="meeting-header">
                                <div><div className="meeting-title">{m.titre}</div><div className="meeting-info">{typeLabels[m.type] || m.type}</div></div>
                                <div className="meeting-date">{formatDate(m.date)}<br/>{m.heure}</div>
                            </div>
                            <div className="meeting-info">📍 {m.lieu}</div>
                            <div className="meeting-agenda"><strong>Ordre du jour :</strong><pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap' }}>{m.agenda}</pre></div>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                                {m.statut === 'upcoming' ? (
                                    <button className="btn btn-secondary btn-small" onClick={() => completeMeeting(m.id)}>✓ Marquer terminée</button>
                                ) : (
                                    <button className="btn btn-outline btn-small">📄 Voir PV</button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>

    {/* TAB 4: CONTENT */}
    <div className={`tab-content ${activeTab === 'content' ? 'active' : ''}`}>
        <div className="section-header"><h2>📝 Gestion du Contenu Public</h2></div>
        <div className="sub-tabs">
            <button className={`sub-tab ${contentSection === 'news' ? 'active' : ''}`} onClick={() => setContentSection('news')}>📰 Actualités</button>
            <button className={`sub-tab ${contentSection === 'domains' ? 'active' : ''}`} onClick={() => setContentSection('domains')}>🌍 Domaines</button>
            <button className={`sub-tab ${contentSection === 'site' ? 'active' : ''}`} onClick={() => setContentSection('site')}>🏠 Site Config</button>
        </div>

        {contentSection === 'news' && (
            <div>
                {news.map(n => (
                    <div key={n.id} className="member-item">
                        <div className="member-item-header">
                            <div className="member-info">
                                <div className="member-name-text">{n.title}</div>
                                <div className="member-meta">{n.category} • {formatDate(n.createdAt)}</div>
                                <span className={`badge ${n.status === 'publie' ? 'badge-success' : 'badge-warning'}`} style={{ marginTop: '4px' }}>{n.status}</span>
                            </div>
                        </div>
                        <div className="member-actions">
                            {n.status !== 'publie' && <button className="btn btn-success btn-small" onClick={() => publishNews(n.id)}>🚀 Publier</button>}
                            <button className="btn btn-danger btn-small" onClick={() => removeNews(n.id)}>️ Supprimer</button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {contentSection === 'domains' && (
            <div>
                {domains.map(d => (
                    <div key={d.id} className="member-item">
                        <div className="member-item-header">
                            <div style={{ fontSize: '24px', marginRight: '12px' }}>{d.iconName}</div>
                            <div className="member-info"><div className="member-name-text">{d.title}</div></div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {contentSection === 'site' && (
            <form onSubmit={saveSiteConfig}>
                <div className="card"><h3 className="card-title">Titre principal</h3><input type="text" id="cfgHeroTitle" className="search-input" defaultValue={siteConfig.heroTitle} style={{ paddingLeft: '12px', backgroundImage: 'none' }} /></div>
                <div className="card"><h3 className="card-title">Sous-titre</h3><textarea id="cfgHeroSubtitle" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} defaultValue={siteConfig.heroSubtitle} rows={3}></textarea></div>
                <div className="card"><h3 className="card-title">Historique</h3><textarea id="cfgHistory" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} defaultValue={siteConfig.aboutHistory} rows={4}></textarea></div>
                <div className="card"><h3 className="card-title">Mission</h3><textarea id="cfgMission" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} defaultValue={siteConfig.aboutMission} rows={3}></textarea></div>
                <div className="card"><h3 className="card-title">Contacts</h3>
                    <input type="text" id="cfgAddress" defaultValue={siteConfig.contactAddress} placeholder="Adresse" style={{ width: '100%', padding: '8px', marginBottom: '8px' }} />
                    <input type="text" id="cfgPhone1" defaultValue={siteConfig.contactPhone1} placeholder="Tel 1" style={{ width: '100%', padding: '8px', marginBottom: '8px' }} />
                    <input type="text" id="cfgPhone2" defaultValue={siteConfig.contactPhone2} placeholder="Tel 2" style={{ width: '100%', padding: '8px', marginBottom: '8px' }} />
                    <input type="text" id="cfgEmail" defaultValue={siteConfig.contactEmail} placeholder="Email" style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" className="btn btn-gold btn-block">💾 Enregistrer Configuration</button>
            </form>
        )}
    </div>

    {/* TAB 5: REPORTS */}
    <div className={`tab-content ${activeTab === 'reports' ? 'active' : ''}`}>
        <div className="section-header"><h2>📊 Rapports & Statistiques</h2></div>
        <div className="stats-grid">
            <div className="stat-card success"><div className="stat-icon">👥</div><div className="stat-value">{members.length}</div><div className="stat-label">Membres totaux</div></div>
            <div className="stat-card"><div className="stat-icon">📋</div><div className="stat-value">{meetings.filter(m=>m.statut === 'completed').length}</div><div className="stat-label">Réunions</div></div>
            <div className="stat-card success"><div className="stat-icon">📰</div><div className="stat-value">{publishedNewsCount}</div><div className="stat-label">Actualités</div></div>
            <div className="stat-card"><div className="stat-icon">👁️</div><div className="stat-value">{news.reduce((sum, n) => sum + (n.views || 0), 0)}</div><div className="stat-label">Vues totales</div></div>
        </div>
        <div className="card">
            <div className="card-header"><h3 className="card-title">📄 Rapports disponibles</h3></div>
            {reportsList.map((r, i) => (
                <div key={i} className="report-card">
                    <div className="report-icon">{r.icon}</div>
                    <div className="report-info"><div className="report-title">{r.title}</div><div className="report-meta">{r.meta}</div></div>
                    <button className="btn btn-primary btn-small">⬇</button>
                </div>
            ))}
        </div>
        <div className="card">
            <div className="card-header"><h3 className="card-title">🌍 Activités par domaine</h3></div>
            {domainStats.map((d, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bleu-rca)' }}>{d.name}</span>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{d.count} activités</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${(d.count / maxDomainCount) * 100}%`, background: d.color }}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>

    {/* TAB 6: SUPPLEANCE */}
    <div className={`tab-content ${activeTab === 'suppleance' ? 'active' : ''}`}>
        <div className="section-header"><h2>⚡ Mode Suppléance</h2><p>Remplacer le Président en son absence</p></div>
        <div className="card">
            <div className="alert-box info"><div className="alert-icon">ℹ️</div><div className="alert-content"><h4>Conformément à l'Article 15 du RI</h4><p>Le Vice-Président supplée le Président en cas d'absence ou d'empêchement.</p></div></div>
            <div style={{ marginTop: '20px' }}>
                <button className="btn btn-gold btn-block" onClick={activateSuppleance}>⚡ Activer le mode suppléance</button>
            </div>
        </div>
        <div className="card">
            <div className="card-header"><h3 className="card-title">📜 Historique des suppléances</h3></div>
            {suppleanceHistory.length === 0 ? <div className="empty-state"><h3>Aucun historique</h3></div> : (
                suppleanceHistory.map(s => (
                    <div key={s.id} className="report-card">
                        <div className="report-icon">⚡</div>
                        <div className="report-info">
                            <div className="report-title">{formatDate(s.date)} - {s.duree}</div>
                            <div className="report-meta">{s.raison}</div>
                            <div className="report-meta" style={{ marginTop: '4px' }}><strong>Actions:</strong> {s.actions}</div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>

    {/* TAB COMMISSIONS: Commissions / Projets */}
    <div className={`tab-content ${activeTab === 'commissions' ? 'active' : ''}`}>
        <div className="section-header"><h2>🏛️ Commissions & Projets</h2><p>Supervision des comités de l'association</p></div>
        <div className="card">
            <h3 className="card-title">Commissions Techniques</h3>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {commissions.length > 0 ? commissions.map(c => (
                    <div key={c.id} className="stat-card">
                        <div className="stat-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>{c.name}</div>
                        <div className="stat-sublabel">Resp: {c.lead}</div>
                        <div className="stat-value" style={{ fontSize: '18px', marginTop: '8px' }}>{c.status || 'Actif'}</div>
                    </div>
                )) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Aucune commission enregistrée</div>
                )}
            </div>
            <form onSubmit={async (e) => {
                e.preventDefault();
                const name = (document.getElementById('comName') as HTMLInputElement).value;
                const lead = (document.getElementById('comLead') as HTMLInputElement).value;
                if(name && lead) {
                    await addDoc(collection(db, 'commissions'), { name, lead, status: 'Actif', createdAt: serverTimestamp() });
                    (e.target as HTMLFormElement).reset();
                }
            }} style={{ marginTop: '20px' }}>
                <h3 className="card-title">Créer une commission</h3>
                <div className="form-row">
                    <input type="text" id="comName" placeholder="Nom de la commission" className="search-input" required />
                    <input type="text" id="comLead" placeholder="Responsable" className="search-input" required />
                    <button type="submit" className="btn btn-primary">Créer</button>
                </div>
            </form>
        </div>
    </div>

    {/* TAB TASKS: Tâches Déléguées */}
    <div className={`tab-content ${activeTab === 'tasks' ? 'active' : ''}`}>
        <div className="section-header">
            <h2>📋 Tâches & Délégation</h2>
            <button className="btn btn-primary" onClick={() => setTaskModalOpen(true)}>+ Nouvelle tâche</button>
        </div>
        <div className="card">
            {tasks.map(t => (
                <div key={t.id} className="transaction-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title">{t.title}</div>
                        <div className="transaction-meta">Assigné à: {t.assignedTo} • Échéance: {formatDate(t.deadline)}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>{t.description}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span className={`badge ${t.completed ? 'badge-success' : 'badge-warning'}`}>{t.completed ? 'Terminé' : 'En cours'}</span>
                        <button className="btn btn-outline btn-small" onClick={() => toggleTask(t.id, t.completed)}>
                            {t.completed ? 'Rouvrir' : 'Terminer'}
                        </button>
                    </div>
                </div>
            ))}
            {tasks.length === 0 && <div className="empty-state">Aucune tâche.</div>}
        </div>
    </div>

    
        <div className="section-header" style={{ marginTop: '32px' }}>
            <h2>🤝 Missions de Bénévolat (Membres)</h2>
            <button className="btn btn-primary" onClick={() => setMissionModalOpen(true)}>+ Nouvelle mission</button>
        </div>
        <div className="card">
            {missionsBenevolat.length === 0 && <p className="text-center text-muted">Aucune mission publiée.</p>}
            {missionsBenevolat.map(m => (
                <div key={m.id} className="transaction-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title">{m.title}</div>
                        <div className="transaction-meta">Date: {formatDate(m.date)} • Lieu: {m.location}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px', color: '#666' }}>{m.description}</div>
                        <div style={{ marginTop: '8px' }}>
                            <span className="badge badge-info" style={{ marginRight: '8px' }}>{m.participants?.length || 0} / {m.requiredVolunteers || '∞'} bénévoles</span>
                            <span className={`badge ${m.status === 'ouverte' ? 'badge-success' : m.status === 'complete' ? 'badge-warning' : 'badge-danger'}`}>
                                {m.status === 'ouverte' ? 'Ouverte' : m.status === 'complete' ? 'Complète' : 'Terminée'}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        {m.status === 'ouverte' && (
                            <button className="btn btn-outline btn-small" onClick={async () => {
                                await updateDoc(doc(db, 'missions_benevolat', m.id), { status: 'terminee' });
                            }}>Terminer</button>
                        )}
                        {m.status === 'terminee' && (
                            <button className="btn btn-outline btn-small" onClick={async () => {
                                await updateDoc(doc(db, 'missions_benevolat', m.id), { status: 'ouverte' });
                            }}>Rouvrir</button>
                        )}
                    </div>
                </div>
            ))}
        </div>


    {/* TAB OBJECTIVES */}
    <div className={`tab-content ${activeTab === 'objectives' ? 'active' : ''}`}>
        <div className="section-header"><h2>🎯 Objectifs Stratégiques</h2><p>Tableau de bord des objectifs annuels</p></div>
        <div className="card">
            {objectives.map(o => (
                <div key={o.id} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <strong>{o.title}</strong>
                        <span className="badge badge-info">{o.progress}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${o.progress}%` }}></div></div>
                </div>
            ))}
            {objectives.length === 0 && <div className="empty-state">Aucun objectif défini.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const title = (document.getElementById('objTitle') as HTMLInputElement).value;
                if(title) {
                    await addDoc(collection(db, 'objectives'), { title, progress: 0, createdAt: serverTimestamp() });
                    (e.target as HTMLFormElement).reset();
                }
            }} style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <input type="text" id="objTitle" className="search-input" style={{ flex: 1 }} placeholder="Nouvel objectif annuel..." required />
                <button type="submit" className="btn btn-gold">Ajouter</button>
            </form>
        </div>
    </div>

    {/* TAB PARTENAIRES */}
    <div className={`tab-content ${activeTab === 'partenaires' ? 'active' : ''}`}>
        <div className="section-header"><h2>🤝 Partenaires Stratégiques</h2><p>Base de données des partenariats</p></div>
        <div className="card">
            {partenaires.map(p => (
                <div key={p.id} className="transaction-item">
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title">{p.name}</div>
                        <div className="transaction-meta">{p.type} • Accord signé le {formatDate(p.createdAt)}</div>
                    </div>
                </div>
            ))}
            {partenaires.length === 0 && <div className="empty-state">Aucun partenaire.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const name = (document.getElementById('partName') as HTMLInputElement).value;
                const type = (document.getElementById('partType') as HTMLInputElement).value;
                if(name && type) {
                    await addDoc(collection(db, 'partenaires'), { name, type, createdAt: serverTimestamp() });
                    (e.target as HTMLFormElement).reset();
                }
            }} style={{ marginTop: '20px' }}>
                <div className="form-row">
                    <input type="text" id="partName" className="search-input" placeholder="Nom du partenaire" required />
                    <input type="text" id="partType" className="search-input" placeholder="Type (Ex: ONG, Entreprise...)" required />
                    <button type="submit" className="btn btn-gold">Ajouter</button>
                </div>
            </form>
        </div>
    </div>

    {/* TAB CONFLITS */}
    <div className={`tab-content ${activeTab === 'conflits' ? 'active' : ''}`}>
        <div className="section-header"><h2>⚖️ Médiation & Conflits</h2><p>Gestion des différends (Art. 14 RI)</p></div>
        <div className="card">
            {conflits.map(c => (
                <div key={c.id} className="transaction-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title">{c.title}</div>
                        <div className="transaction-meta">Signalé le {formatDate(c.createdAt)}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>{c.description}</div>
                    </div>
                    <span className={`badge ${c.status === 'resolu' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span>
                </div>
            ))}
            {conflits.length === 0 && <div className="empty-state">Aucun conflit signalé.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const title = (document.getElementById('confTitle') as HTMLInputElement).value;
                const desc = (document.getElementById('confDesc') as HTMLTextAreaElement).value;
                if(title && desc) {
                    await addDoc(collection(db, 'conflits'), { title, description: desc, status: 'en_cours', createdAt: serverTimestamp() });
                    (e.target as HTMLFormElement).reset();
                }
            }} style={{ marginTop: '20px' }}>
                <h3 className="card-title">Ouvrir un dossier de médiation</h3>
                <input type="text" id="confTitle" className="search-input" style={{ width: '100%', marginBottom: '8px' }} placeholder="Sujet du différend" required />
                <textarea id="confDesc" style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '8px' }} rows={3} placeholder="Description..." required></textarea>
                <button type="submit" className="btn btn-danger btn-block">Signaler</button>
            </form>
        </div>
    </div>

    {/* TAB MESSAGES */}
      <div className={`tab-content ${activeTab === 'messages' ? 'active' : ''}`}>
        <div className="section-header" style={{ marginBottom: '8px', padding: '0 16px' }}><h2>💬 Chat Bureau</h2><p>Boîte de réception centralisée</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh', minHeight: '500px', padding: 0, overflow: 'hidden', background: '#efeae2', borderRadius: '12px' }}>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {boardMessages.map(m => {
                    const isMe = m.role === 'vice_president';
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
                    id="vpChatMsg" 
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
                            const input = document.getElementById('vpChatMsg') as HTMLTextAreaElement;
                            if(input.value.trim()) {
                                await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Vice-Président', role: 'vice_president', timestamp: serverTimestamp() });
                                input.value = '';
                                input.style.height = 'auto';
                            }
                        }
                    }}
                />
                <button 
                    onClick={async () => {
                        const input = document.getElementById('vpChatMsg') as HTMLTextAreaElement;
                        if(input.value.trim()) {
                            await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Vice-Président', role: 'vice_president', timestamp: serverTimestamp() });
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

      {/* TAB EXPENSES (Suppleance) */}
    {isSuppleanceActive && (
    <div className={`tab-content ${activeTab === 'expenses' ? 'active' : ''}`}>
        <div className="section-header"><h2>💰 Dépenses & Cosignature</h2><p>Pouvoirs du Président débloqués</p></div>
        <div className="card">
            {expenses.map(e => (
                <div key={e.id} className="transaction-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title">{e.description || e.titre || 'Dépense sans titre'}</div>
                        <div className="transaction-meta">{formatDate(e.date)} • {(e.montant || e.amount || 0).toLocaleString()} F</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span className={`badge ${(e.status === 'signed' || e.statut === 'signed' || e.presidentSignature) ? 'badge-success' : 'badge-warning'}`}>
                            {(e.status === 'signed' || e.statut === 'signed' || e.presidentSignature) ? 'Signée' : 'En attente'}
                        </span>
                        {!(e.status === 'signed' || e.statut === 'signed' || e.presidentSignature) && (
                            <button className="btn btn-primary btn-small" onClick={() => signExpense(e.id)}>✍️ Cosigner</button>
                        )}
                    </div>
                </div>
            ))}
            {expenses.length === 0 && <div className="empty-state">Aucune dépense trouvée.</div>}
        </div>
    </div>
    )}

    {/* BOTTOM NAV (MOBILE) */}
    <nav className="bottom-nav">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><span className="nav-icon">🏠</span><span>Dash</span></button>
        <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}><span className="nav-icon">📋</span><span>Tâches</span></button>
        <button className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}><span className="nav-icon">👥</span><span>Membres</span></button>
        <button className={activeTab === 'meetings' ? 'active' : ''} onClick={() => setActiveTab('meetings')}><span className="nav-icon">📅</span><span>Réunions</span></button>
        <button className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}><span className="nav-icon">📝</span><span>Contenu</span></button>
        {isSuppleanceActive && (
           <button className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}><span className="nav-icon">💰</span><span>Dépenses</span></button>
        )}
    </nav>

    {/* MODALS & CONFIRM DIALOG */}
    {meetingModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Convoquer une réunion</h3>
                <form onSubmit={saveMeeting}>
                    <div className="form-group"><label>Type</label><select id="meetingType"><option value="bureau">Bureau Exécutif</option><option value="ag_ordinaire">AG Ordinaire</option></select></div>
                    <div className="form-row">
                        <div className="form-group"><label>Date</label><input type="date" id="meetingDate" required style={{ width: '100%', padding: '8px' }} /></div>
                        <div className="form-group"><label>Heure</label><input type="time" id="meetingTime" required style={{ width: '100%', padding: '8px' }} /></div>
                    </div>
                    <div className="form-group"><label>Lieu</label><input type="text" id="meetingLocation" defaultValue="Siège social" style={{ width: '100%', padding: '8px' }} required /></div>
                    <div className="form-group"><label>Ordre du jour</label><textarea id="meetingAgenda" rows={4} style={{ width: '100%', padding: '8px' }} required></textarea></div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary">Convoquer</button>
                        <button type="button" className="btn btn-outline" onClick={() => setMeetingModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )}

    
    {missionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Nouvelle Mission Bénévolat</h3>
                <form onSubmit={saveMission}>
                    <div className="form-group"><label>Titre de la mission</label><input type="text" id="missionTitle" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Description</label><textarea id="missionDescription" rows={3} style={{ width: '100%', padding: '8px' }} required></textarea></div>
                    <div className="form-row">
                        <div className="form-group"><label>Date de l'événement</label><input type="date" id="missionDate" required style={{ width: '100%', padding: '8px' }} /></div>
                        <div className="form-group"><label>Lieu</label><input type="text" id="missionLocation" required style={{ width: '100%', padding: '8px' }} /></div>
                    </div>
                    <div className="form-group">
                        <label>Nombre de bénévoles requis (0 = illimité)</label>
                        <input type="number" id="missionVolunteers" min="0" defaultValue="0" style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" className="btn btn-primary">Publier la mission</button>
                        <button type="button" className="btn btn-outline" onClick={() => setMissionModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )}


    {taskModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Nouvelle tâche de coordination</h3>
                <form onSubmit={saveTask}>
                    <div className="form-group"><label>Titre de la tâche</label><input type="text" id="taskTitle" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Description</label><textarea id="taskDescription" rows={3} style={{ width: '100%', padding: '8px' }}></textarea></div>
                    <div className="form-row">
                        <div className="form-group"><label>Priorité</label><select id="taskPriority"><option value="normal">Normale</option><option value="urgente">Urgente</option></select></div>
                        <div className="form-group"><label>Date limite</label><input type="date" id="taskDeadline" style={{ width: '100%', padding: '8px' }} /></div>
                    </div>
                    <div className="form-group">
                        <label>Assigné à</label>
                        <select id="taskAssignedTo" style={{ width: '100%', padding: '8px' }}>
                            <option value="secretaire">Secrétaire</option>
                            <option value="tresorier">Trésorier</option>
                            <option value="communicateur">Communicateur</option>
                            <option value="conseiller">Conseiller</option>
                            <option value="president">Président</option>
                            <option value="vice_president">Moi-même</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                        <button type="button" className="btn btn-outline" onClick={() => setTaskModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )}

    {confirmDialog.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Confirmation</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{confirmDialog.message}</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                    <button className="btn btn-outline" onClick={() => setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} })}>Annuler</button>
                    <button className="btn btn-primary" onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ isOpen: false, message: '', onConfirm: () => {} }); }}>Confirmer</button>
                </div>
            </div>
        </div>
    )}

    </div>
  );
};
