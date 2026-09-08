import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth, secondaryAuth } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import './PresidentDashboard.css';

export const PresidentDashboard = () => {
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
  const [expenseFilter, setExpenseFilter] = useState('pending');
  const [contentSection, setContentSection] = useState('news');

  // Modals
  const [memberModal, setMemberModal] = useState<any>(null);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: () => {} });

  // Data State
  const [members, setMembers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({});
  const [notifications, setNotifications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [crisisMode, setCrisisMode] = useState(false);

  // Computed Stats
  const pendingApprovals = members.filter(m => m.statut === 'en_attente').length;
  const upcomingMeetings = meetings.filter(m => m.statut === 'upcoming').length;
  const pendingExpensesCount = expenses.filter(e => e.status === 'pending' || e.statut === 'pending').length;
  const publishedNewsCount = news.filter(n => n.status === 'publie').length;
  
  const totalIncome = incomes.reduce((sum, e) => sum + (Number(e.montant) || Number(e.amount) || 0), 0);
  const totalExpenses = expenses.filter(e => e.status === 'signed' || e.statut === 'signed' || e.status === 'approved' || e.statut === 'approved').reduce((sum, e) => sum + (Number(e.montant) || Number(e.amount) || 0), 0);
  const pendingExpensesSum = expenses.filter(e => e.status === 'pending' || e.statut === 'pending').reduce((sum, e) => sum + (Number(e.montant) || Number(e.amount) || 0), 0);
  const currentBalance = totalIncome - totalExpenses;

  // Real-time Listeners
  useEffect(() => {
    // 1. Members (using 'users' collection)
    const unsubMembers = onSnapshot(collection(db, 'users'), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Meetings
    const unsubMeetings = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc')), (snap) => {
      setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Finances (Expenses & Income)
    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snap) => {
      setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubIncomes = onSnapshot(query(collection(db, 'income'), orderBy('date', 'desc')), (snap) => {
      setIncomes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Content (news, domains, site_config)
    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc')), (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubDomains = onSnapshot(query(collection(db, 'domains'), orderBy('order', 'asc')), (snap) => {
      setDomains(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (docSnap) => {
      if (docSnap.exists()) setSiteConfig(docSnap.data());
    });

    // 5. Notifications & Audit Logs
    const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubLogs = onSnapshot(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')), (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 6. Tasks (Délégation) & Messages
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => {
      setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCrisis = onSnapshot(doc(db, 'system', 'crisis'), (docSnap) => {
      if (docSnap.exists()) setCrisisMode(docSnap.data().active || false);
    });

    return () => {
      unsubMembers();
      unsubMeetings();
      unsubExpenses();
      unsubIncomes();
      unsubNews();
      unsubDomains();
      unsubConfig();
      unsubNotifs();
      unsubLogs();
      unsubTasks();
      unsubMessages();
      unsubCrisis();
    };
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

  const logDecision = async (action: string, details: string) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        action,
        details,
        user: userData?.displayName || 'Président',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCrisisMode = () => {
    const newStatus = !crisisMode;
    confirmAction(newStatus ? '🚨 Activer le Mode Crise ? Tous les membres seront notifiés et les actions restreintes.' : '✅ Désactiver le Mode Crise ?', async () => {
      await setDoc(doc(db, 'system', 'crisis'), { active: newStatus, timestamp: serverTimestamp(), by: userData?.displayName || 'Président' });
      await logDecision('MODE_CRISE', `Mode crise ${newStatus ? 'activé' : 'désactivé'}`);
    });
  };

  const handleLogout = async () => {
    confirmAction('🚪 Êtes-vous sûr de vouloir vous déconnecter ?', async () => {
      try {
        await signOut(auth);
        navigate('/');
      } catch (err) {
        console.error('Logout error', err);
      }
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
    confirmAction('✓ Approuver ce membre ? Un email de confirmation lui sera envoyé.', async () => {
        await updateDoc(doc(db, 'users', id), {
            statut: 'a_jour',
            approvedAt: serverTimestamp(),
            approvedBy: 'president'
        });
        await logDecision('APPROBATION_MEMBRE', `Membre ${id} approuvé`);
    });
  };

  const rejectMember = (id: string, isRequest: boolean) => {
      confirmAction('✕ Refuser ce membre ?', async () => {
        await updateDoc(doc(db, 'users', id), {
            statut: 'refuse',
            rejectedAt: serverTimestamp()
        });
        await logDecision('REFUS_MEMBRE', `Membre ${id} refusé`);
      });
  };

  const deleteMember = (id: string) => {
      confirmAction('🗑️ Êtes-vous sûr de vouloir supprimer définitivement ce compte ?', async () => {
        await deleteDoc(doc(db, 'users', id));
        await logDecision('SUPPRESSION_MEMBRE', `Membre ${id} supprimé`);
      });
  };

  const suspendMember = (id: string) => {
      confirmAction('⚠️ Suspendre ce membre ? Il perdra temporairement l\'accès.', async () => {
        await updateDoc(doc(db, 'users', id), {
            statut: 'suspendu',
            suspendedAt: serverTimestamp()
        });
        await logDecision('SUSPENSION_MEMBRE', `Membre ${id} suspendu`);
      });
  };

  const changeMemberRole = async (id: string, newRole: string) => {
    confirmAction(`🔄 Changer le rôle en ${newRole} ?`, async () => {
        await updateDoc(doc(db, 'users', id), { role: newRole });
        await logDecision('CHANGEMENT_ROLE', `Rôle du membre ${id} changé en ${newRole}`);
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
        type,
        date,
        heure: (document.getElementById('meetingTime') as HTMLInputElement).value,
        lieu: (document.getElementById('meetingLocation') as HTMLInputElement).value,
        agenda: (document.getElementById('meetingAgenda') as HTMLTextAreaElement).value,
        statut: 'upcoming',
        convoquePar: 'president',
        titre: `${type === 'bureau' ? 'Réunion Bureau' : type === 'ag_ordinaire' ? 'AG Ordinaire' : 'AG Extraordinaire'} - ${formatDate(date)}`,
        createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'meetings'), data);
    setMeetingModalOpen(false);
  };

  const completeMeeting = (id: string) => {
      confirmAction('✓ Marquer cette réunion comme terminée ? N\'oubliez pas de rédiger le PV.', async () => {
        await updateDoc(doc(db, 'meetings', id), {
            statut: 'completed',
            completedAt: serverTimestamp()
        });
      });
  };

  // EXPENSES ACTIONS
  const filteredExpenses = expenses.filter(e => {
    if (expenseFilter === 'all') return true;
    if (expenseFilter === 'pending') return e.statut === 'pending';
    if (expenseFilter === 'signed') return e.statut === 'signed';
    return true;
  });

  const signExpense = (id: string) => {
    confirmAction('✍️ Signer cette dépense ?\n\nArt. 16 Statuts: La dépense sera autorisée après cosignature avec le Trésorier.', async () => {
        await updateDoc(doc(db, 'transactions', id), {
            statut: 'signed',
            presidentSignature: true,
            signedAt: serverTimestamp(),
            signedBy: 'president'
        });
        await updateDoc(doc(db, 'expenses', id), {
            status: 'signed',
            statut: 'signed',
            presidentSignature: true
        });
        await logDecision('SIGNATURE_DEPENSE', `Dépense ${id} signée`);
    });
  };

  // CONTENT ACTIONS
  const publishNews = (id: string) => {
    confirmAction('🚀 Publier cette actualité sur le site public ?', async () => {
        await updateDoc(doc(db, 'news', id), {
            status: 'publie',
            publishedAt: serverTimestamp()
        });
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
        updatedAt: serverTimestamp(),
        updatedBy: 'president'
    };
    await setDoc(doc(db, 'site_config', 'main'), config, { merge: true });
    alert('✅ Configuration sauvegardée !');
  };

  // NOTIFICATIONS ACTIONS
  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
        titre: (document.getElementById('notifTitle') as HTMLInputElement).value,
        message: (document.getElementById('notifMessage') as HTMLTextAreaElement).value,
        target: (document.getElementById('notifTarget') as HTMLSelectElement).value,
        channel: (document.getElementById('notifChannel') as HTMLSelectElement).value,
        urgent: (document.getElementById('notifUrgent') as HTMLInputElement).checked,
        sentBy: 'president',
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'notifications'), data);
    form.reset();
  };

  return (
    <div className="president-dashboard-container">
      {/* HEADER COMPACT (APP BAR) */}
      <header className="dashboard-header-compact">
        <div className="header-compact-left">
            <div className="avatar-mini">{userData?.displayName?.charAt(0)?.toUpperCase() || 'P'}</div>
            <div className="header-titles">
                <h1>I KOUE GUI A ITA</h1>
                <span>{userData?.displayName || 'Sosthène M. ZONAITA'} • Président</span>
            </div>
        </div>
        <div className="header-compact-actions">
            <div style={{ position: 'relative' }}>
                <button className="header-btn" onClick={() => setShowNotifPanel(!showNotifPanel)} aria-label="Notifications">
                    🔔
                    {(pendingApprovals + pendingExpensesCount) > 0 && (
                        <span className="notif-badge">{pendingApprovals + pendingExpensesCount}</span>
                    )}
                </button>
                {showNotifPanel && (
                    <div className="notif-dropdown">
                        <h4>🔔 Actions Requises</h4>
                        {pendingApprovals > 0 && (
                            <div className="notif-dropdown-item warning" onClick={() => { setActiveTab('members'); setShowNotifPanel(false); }}>
                                <span>⏳</span> {pendingApprovals} adhésion(s) en attente
                            </div>
                        )}
                        {pendingExpensesCount > 0 && (
                            <div className="notif-dropdown-item danger" onClick={() => { setActiveTab('expenses'); setShowNotifPanel(false); }}>
                                <span>💰</span> {pendingExpensesCount} dépense(s) à signer
                            </div>
                        )}
                        {pendingApprovals === 0 && pendingExpensesCount === 0 && (
                            <div className="notif-dropdown-empty">Aucune action urgente.</div>
                        )}
                    </div>
                )}
            </div>
            <button className="header-btn" onClick={handleLogout} aria-label="Déconnexion" title="Déconnexion">🚪</button>
        </div>
    </header>

    {/* TAB NAVIGATION */}
    <nav className="tab-nav">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="tab-icon">🏠</span>
            <span>Dashboard</span>
        </button>
        <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            <span className="tab-icon">👥</span>
            <span>Membres</span>
        </button>
        <button className={`tab-btn ${activeTab === 'meetings' ? 'active' : ''}`} onClick={() => setActiveTab('meetings')}>
            <span className="tab-icon">📋</span>
            <span>Réunions</span>
        </button>
        <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
            <span className="tab-icon">💰</span>
            <span>Dépenses</span>
        </button>
        <button className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
            <span className="tab-icon">📝</span>
            <span>Contenu</span>
        </button>
        <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span className="tab-icon">📢</span>
            <span>Notifs</span>
        </button>
        <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <span className="tab-icon">📋</span>
            <span>Délégation</span>
        </button>
        <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <span className="tab-icon">📊</span>
            <span>Rapports</span>
        </button>
        <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            <span className="tab-icon">💬</span>
            <span>Chat Bureau</span>
        </button>
    </nav>

    {/* TAB 1: DASHBOARD */}
    <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
        {crisisMode && (
          <div className="alert-box danger" style={{ marginBottom: '16px', background: '#FEF2F2', border: '1px solid #EF4444' }}>
            <div className="alert-icon">🚨</div>
            <div className="alert-content">
              <h4 style={{ color: '#B91C1C' }}>MODE CRISE ACTIVÉ</h4>
              <p style={{ color: '#7F1D1D' }}>Opérations courantes suspendues. Mesures d'urgence en vigueur (Art. 17).</p>
            </div>
            <button className="btn btn-danger btn-small" onClick={toggleCrisisMode}>Désactiver</button>
          </div>
        )}

        <div className="welcome-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: crisisMode ? 'linear-gradient(135deg, #7F1D1D 0%, #B91C1C 100%)' : undefined }}>
            <div>
              <span className="role-badge">⭐ Président</span>
              <h2>Bienvenue, Mr le Président ✨</h2>
              <p>Vous avez plusieurs actions requises aujourd'hui. Le Bureau compte sur votre leadership.</p>
            </div>
            {!crisisMode && (
              <button onClick={toggleCrisisMode} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: '50%', width: '56px', height: '56px', fontSize: '24px', flexShrink: 0, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }} title="Déclencher Action d'Urgence">🚨</button>
            )}
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
            <div className={`stat-card ${pendingExpensesCount > 0 ? 'alert' : ''}`} onClick={() => setActiveTab('expenses')}>
                <div className="stat-icon">💰</div>
                <div className="stat-value">{pendingExpensesCount}</div>
                <div className="stat-label">Dépenses</div>
                <div className="stat-sublabel">À signer</div>
            </div>
            <div className="stat-card success">
                <div className="stat-icon">📰</div>
                <div className="stat-value">{publishedNewsCount}</div>
                <div className="stat-label">Actualités</div>
                <div className="stat-sublabel">Publiées</div>
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
            {pendingExpensesCount > 0 && (
                <div className="alert-box danger">
                    <div className="alert-icon">💰</div>
                    <div className="alert-content">
                        <h4>{pendingExpensesCount} dépense(s) à signer</h4>
                        <p>Art. 16 Statuts: Cosignature Président + Trésorier requise.</p>
                    </div>
                    <button className="btn btn-outline btn-small" onClick={() => setActiveTab('expenses')}>Voir →</button>
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
        </div>

        <div className="card">
            <div className="card-header">
                <h3 className="card-title">⚡ Actions rapides</h3>
            </div>
            <div className="quick-actions">
                <div className="quick-action" onClick={() => setActiveTab('members')}>
                    <div className="qa-icon">👥</div>
                    <div className="qa-title">Gérer membres</div>
                </div>
                <div className="quick-action" onClick={() => { setActiveTab('meetings'); setMeetingModalOpen(true); }}>
                    <div className="qa-icon">📋</div>
                    <div className="qa-title">Convoquer AG</div>
                </div>
                <div className="quick-action" onClick={() => setActiveTab('expenses')}>
                    <div className="qa-icon">💰</div>
                    <div className="qa-title">Signer dépense</div>
                </div>
            </div>
        </div>

        <div className="card">
            <div className="card-header">
                <h3 className="card-title">📜 Rappels Statutaires</h3>
            </div>
            <ul style={{ fontSize: '14px', color: 'var(--texte-principal)', paddingLeft: '20px', lineHeight: 1.8 }}>
                <li><strong>Art. 14 RI :</strong> Le Bureau se réunit au moins une fois par mois</li>
                <li><strong>Art. 16 Statuts :</strong> Toute dépense autorisée par Président + Trésorier</li>
                <li><strong>Art. 6 RI :</strong> Convocation AG 7 jours avant la date</li>
            </ul>
        </div>
    </div>

    {/* TAB 2: MEMBRES */}
    <div className={`tab-content ${activeTab === 'members' ? 'active' : ''}`}>
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2>👥 Gestion des Membres</h2>
                <p>{members.length} membre(s) au total</p>
            </div>
            <button className="btn btn-primary" onClick={() => setAddMemberModalOpen(true)}>+ Nouveau membre</button>
        </div>

        <div className="sub-tabs">
            <button className={`sub-tab ${memberFilter === 'all' ? 'active' : ''}`} onClick={() => setMemberFilter('all')}>Tous</button>
            <button className={`sub-tab ${memberFilter === 'en_attente' ? 'active' : ''}`} onClick={() => setMemberFilter('en_attente')}>⏳ En attente</button>
            <button className={`sub-tab ${memberFilter === 'actif' ? 'active' : ''}`} onClick={() => setMemberFilter('actif')}>✅ Actifs</button>
            <button className={`sub-tab ${memberFilter === 'bienfaiteur' ? 'active' : ''}`} onClick={() => setMemberFilter('bienfaiteur')}>💛 Bienfaiteurs</button>
        </div>

        <div className="filters-bar">
            <input type="text" className="search-input" placeholder="Rechercher un membre..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
        </div>

        <div>
            {filteredMembers.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">👥</div><h3>Aucun membre trouvé</h3></div>
            ) : (
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                  <button className="btn btn-outline btn-small" onClick={() => setMemberModal(m)}>👁️ Voir</button>
                                  {m.statut !== 'suspendu' && m.statut !== 'refuse' && (
                                    <button className="btn btn-danger btn-small" style={{ background: 'transparent', color: '#EF4444', border: '1px solid #EF4444', padding: '2px 8px' }} onClick={() => suspendMember(m.id)}>⚠️ Suspendre</button>
                                  )}
                                  <button className="btn btn-danger btn-small" style={{ background: '#EF4444', color: 'white', padding: '2px 8px', border: 'none' }} onClick={() => deleteMember(m.id)}>🗑️ Supprimer</button>
                                  <select className="search-input" style={{ padding: '2px 4px', fontSize: '11px', height: 'auto', backgroundImage: 'none' }} value={m.role || 'membre'} onChange={(e) => changeMemberRole(m.id, e.target.value)}>
                                    <option value="membre">👤 Membre</option>
                                    <option value="tresorier">💰 Trésorier</option>
                                    <option value="secretaire">📝 Secrétaire</option>
                                    <option value="conseiller">🧠 Conseiller</option>
                                    <option value="vice_president">🛡️ Vice-Président</option>
                                    <option value="communicateur">📢 Communicateur</option>
                                  </select>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>

    {/* TAB 3: RÉUNIONS */}
    <div className={`tab-content ${activeTab === 'meetings' ? 'active' : ''}`}>
        <div className="section-header">
            <h2>📋 Réunions & Assemblées Générales</h2>
        </div>
        
        <button className="btn btn-gold btn-block" onClick={() => setMeetingModalOpen(true)} style={{ marginBottom: '16px' }}>
            ➕ Convoquer une réunion
        </button>

        <div className="sub-tabs">
            <button className={`sub-tab ${meetingFilter === 'all' ? 'active' : ''}`} onClick={() => setMeetingFilter('all')}>Toutes</button>
            <button className={`sub-tab ${meetingFilter === 'upcoming' ? 'active' : ''}`} onClick={() => setMeetingFilter('upcoming')}>📅 À venir</button>
            <button className={`sub-tab ${meetingFilter === 'bureau' ? 'active' : ''}`} onClick={() => setMeetingFilter('bureau')}>👔 Bureau</button>
            <button className={`sub-tab ${meetingFilter === 'ag' ? 'active' : ''}`} onClick={() => setMeetingFilter('ag')}>🏛️ AG</button>
        </div>

        <div>
            {filteredMeetings.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📋</div><h3>Aucune réunion</h3></div>
            ) : (
                filteredMeetings.map(m => {
                    const typeLabels: Record<string, string> = { bureau: '👔 Bureau', ag_ordinaire: '🏛️ AG Ordinaire', ag_extraordinaire: '⚡ AG Extraordinaire' };
                    return (
                        <div key={m.id} className={`meeting-item ${m.statut === 'upcoming' ? 'upcoming' : ''} ${m.type === 'ag_extraordinaire' ? 'urgent' : ''}`}>
                            <div className="meeting-header">
                                <div>
                                    <div className="meeting-title">{m.titre}</div>
                                    <div className="meeting-info">{typeLabels[m.type] || m.type}</div>
                                </div>
                                <div className="meeting-date">{formatDate(m.date)}<br/>{m.heure}</div>
                            </div>
                            <div className="meeting-info">📍 {m.lieu}</div>
                            <div className="meeting-agenda">
                                <strong>Ordre du jour :</strong>
                                <pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap' }}>{m.agenda}</pre>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                                {m.statut === 'upcoming' ? (
                                    <button className="btn btn-secondary btn-small" onClick={() => completeMeeting(m.id)}>✓ Marquer terminée</button>
                                ) : (
                                    <button className="btn btn-outline btn-small">📄 Voir PV (non implémenté)</button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>

    {/* TAB 4: DÉPENSES */}
    <div className={`tab-content ${activeTab === 'expenses' ? 'active' : ''}`}>
        <div className="section-header">
            <h2>💰 Dépenses & Cosignature</h2>
        </div>

        <div className="finance-summary">
            <div className="finance-card income">
                <div className="fin-label">Recettes totales</div>
                <div className="fin-amount">{totalIncome.toLocaleString()} F</div>
            </div>
            <div className="finance-card expense">
                <div className="fin-label">Dépenses totales</div>
                <div className="fin-amount">{totalExpenses.toLocaleString()} F</div>
            </div>
            <div className="finance-card income">
                <div className="fin-label">Solde actuel</div>
                <div className="fin-amount">{currentBalance.toLocaleString()} F</div>
            </div>
            <div className="finance-card expense">
                <div className="fin-label">En attente</div>
                <div className="fin-amount">{pendingExpensesSum.toLocaleString()} F</div>
            </div>
        </div>

        {pendingExpensesSum > 100000 && (
            <div className="alert-box warning">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                    <h4>{pendingExpensesCount} dépense(s) en attente</h4>
                    <p>Total: {pendingExpensesSum.toLocaleString()} FCFA. Signez pour autoriser le paiement.</p>
                </div>
            </div>
        )}

        <div className="sub-tabs">
            <button className={`sub-tab ${expenseFilter === 'pending' ? 'active' : ''}`} onClick={() => setExpenseFilter('pending')}>⏳ À signer</button>
            <button className={`sub-tab ${expenseFilter === 'signed' ? 'active' : ''}`} onClick={() => setExpenseFilter('signed')}>✅ Signées</button>
            <button className={`sub-tab ${expenseFilter === 'all' ? 'active' : ''}`} onClick={() => setExpenseFilter('all')}>📋 Toutes</button>
        </div>

        <div>
            {filteredExpenses.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">💰</div><h3>Aucune dépense</h3></div>
            ) : (
                filteredExpenses.map(e => (
                    <div key={e.id} className="transaction-item">
                        <div className="transaction-info">
                            <div className="transaction-title">{e.titre || e.title}</div>
                            <div className="transaction-meta">{formatDate(e.date)} • {e.categorie || e.category}</div>
                            {e.statut === 'pending' ? <span className="badge badge-warning" style={{ marginTop: '6px' }}>En attente</span> : <span className="badge badge-success" style={{ marginTop: '6px' }}>✓ Signé</span>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className={`transaction-amount ${e.statut === 'pending' ? 'pending' : 'expense'}`}>
                                -{(e.montant || e.amount)?.toLocaleString()} F
                            </div>
                            {e.statut === 'pending' ? (
                                <button className="btn btn-success btn-small" onClick={() => signExpense(e.id)} style={{ marginTop: '8px' }}>✍️ Signer</button>
                            ) : (
                                <div style={{ fontSize: '11px', color: 'var(--texte-secondaire)', marginTop: '4px' }}>{e.signataire || 'Président'}</div>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>

    {/* TAB 5: CONTENT */}
    <div className={`tab-content ${activeTab === 'content' ? 'active' : ''}`}>
        <div className="section-header">
            <h2>📝 Gestion du Contenu Public</h2>
        </div>

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
                            <div className="member-info">
                                <div className="member-name-text">{d.title}</div>
                            </div>
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

    {/* TAB TASKS: TASKS (Délégation) */}
    <div className={`tab-content ${activeTab === 'tasks' ? 'active' : ''}`}>
        <div className="section-header">
            <h2>📋 Délégation & Suivi</h2>
        </div>
        <div className="card">
            <h3 className="card-title">Assigner une tâche</h3>
            <form onSubmit={async (e) => {
                e.preventDefault();
                const title = (document.getElementById('taskTitle') as HTMLInputElement).value;
                const desc = (document.getElementById('taskDesc') as HTMLTextAreaElement).value;
                const assignee = (document.getElementById('taskAssignee') as HTMLSelectElement).value;
                if(title && desc && assignee) {
                    await addDoc(collection(db, 'tasks'), { title, description: desc, assignedTo: assignee, status: 'pending', createdAt: serverTimestamp(), createdBy: 'president' });
                    (e.target as HTMLFormElement).reset();
                    await logDecision('ASSIGNATION_TACHE', `Tâche "${title}" assignée au ${assignee}`);
                }
            }}>
                <div className="form-group"><label>Titre</label><input type="text" id="taskTitle" required /></div>
                <div className="form-group"><label>Description</label><textarea id="taskDesc" rows={2} required></textarea></div>
                <div className="form-group"><label>Assigner à (Rôle)</label>
                    <select id="taskAssignee" required>
                        <option value="secretaire">Secrétaire</option>
                        <option value="tresorier">Trésorier</option>
                        <option value="communicateur">Communicateur</option>
                        <option value="vice_president">Vice-Président</option>
                        <option value="conseiller">Conseiller</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-gold">Assigner</button>
            </form>
        </div>
        <div className="card">
            <h3 className="card-title">Tâches en cours</h3>
            {tasks.map(t => (
                <div key={t.id} className="transaction-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title">{t.title}</div>
                        <div className="transaction-meta">Assigné à: {t.assignedTo} • {formatDate(t.createdAt)}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>{t.description}</div>
                    </div>
                    <span className={`badge ${t.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span>
                </div>
            ))}
            {tasks.length === 0 && <p style={{ fontSize: '13px', color: '#666' }}>Aucune tâche assignée.</p>}
        </div>
    </div>

    {/* TAB REPORTS: REPORTS & BILAN */}
    <div className={`tab-content ${activeTab === 'reports' ? 'active' : ''}`}>
        <div className="section-header">
            <h2>📊 Rapports & Synthèse</h2>
        </div>
        <div className="card">
            <h3 className="card-title">Bilan Moral Annuel</h3>
            <p style={{ fontSize: '13px', marginBottom: '12px' }}>Rédigez le bilan moral de l'année pour le soumettre à l'Assemblée Générale.</p>
            <textarea rows={6} style={{ width: '100%', padding: '8px', border: '1px solid var(--bordure)', borderRadius: '8px' }} placeholder="Le bilan de l'année s'articule autour de..."></textarea>
            <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => logDecision('BILAN_MORAL', 'Bilan moral mis à jour')}>Sauvegarder le brouillon</button>
        </div>
        <div className="card">
            <h3 className="card-title">📝 Journal des Décisions (Audit)</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {logs.map(l => (
                    <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                        <div style={{ fontSize: '12px', color: 'var(--texte-secondaire)' }}>{formatDate(l.timestamp)} - {l.user}</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--bleu-rca)' }}>{l.action}</div>
                        <div style={{ fontSize: '13px' }}>{l.details}</div>
                    </div>
                ))}
                {logs.length === 0 && <p style={{ fontSize: '13px', color: '#666' }}>Aucun enregistrement.</p>}
            </div>
        </div>
    </div>

    {/* TAB MESSAGES */}
      <div className={`tab-content ${activeTab === 'messages' ? 'active' : ''}`}>
        <div className="section-header" style={{ marginBottom: '8px', padding: '0 16px' }}><h2>💬 Chat Bureau</h2><p>Boîte de réception centralisée</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh', minHeight: '500px', padding: 0, overflow: 'hidden', background: '#efeae2', borderRadius: '12px' }}>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {boardMessages.map(m => {
                    const isMe = m.role === 'president';
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
                    id="presChatMsg" 
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
                            const input = document.getElementById('presChatMsg') as HTMLTextAreaElement;
                            if(input.value.trim()) {
                                await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Président', role: 'president', timestamp: serverTimestamp() });
                                input.value = '';
                                input.style.height = 'auto';
                            }
                        }
                    }}
                />
                <button 
                    onClick={async () => {
                        const input = document.getElementById('presChatMsg') as HTMLTextAreaElement;
                        if(input.value.trim()) {
                            await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Président', role: 'president', timestamp: serverTimestamp() });
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

      {/* TAB 6: NOTIFICATIONS */}
    <div className={`tab-content ${activeTab === 'notifications' ? 'active' : ''}`}>
        <div className="section-header">
            <h2>📢 Notifications en Masse</h2>
        </div>
        <div className="card">
            <h3 className="card-title">📤 Nouvelle notification</h3>
            <form onSubmit={sendNotification}>
                <div className="form-group"><label>Titre</label><input type="text" id="notifTitle" required /></div>
                <div className="form-group"><label>Message</label><textarea id="notifMessage" required rows={3}></textarea></div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Destinataires</label>
                        <select id="notifTarget"><option value="all">Tous</option><option value="actifs">Actifs</option><option value="bureau">Bureau</option></select>
                    </div>
                    <div className="form-group">
                        <label>Canal</label>
                        <select id="notifChannel"><option value="app">Push App</option><option value="email">Email</option></select>
                    </div>
                </div>
                <div className="checkbox-group">
                    <input type="checkbox" id="notifUrgent" />
                    <label htmlFor="notifUrgent">⚠️ Urgent</label>
                </div>
                <button type="submit" className="btn btn-gold btn-block">📤 Envoyer</button>
            </form>
        </div>
        <div className="card">
            <h3 className="card-title">Historique</h3>
            {notifications.map(n => (
                <div key={n.id} className="notification-item">
                    <div className="notification-header"><div className="notification-title">{n.titre}</div><div className="notification-time">{formatDate(n.createdAt)}</div></div>
                    <div className="notification-text">{n.message}</div>
                </div>
            ))}
        </div>
    </div>

    {/* BOTTOM NAV (MOBILE) */}
    <nav className="bottom-nav">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><span className="nav-icon">🏠</span><span>Dash</span></button>
        <button className={activeTab === 'members' ? 'active' : ''} onClick={() => setActiveTab('members')}><span className="nav-icon">👥</span><span>Membres</span></button>
        <button className={activeTab === 'meetings' ? 'active' : ''} onClick={() => setActiveTab('meetings')}><span className="nav-icon">📋</span><span>Réunions</span></button>
        <button className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}><span className="nav-icon">💰</span><span>Dépenses</span></button>
        <button className={activeTab === 'content' ? 'active' : ''} onClick={() => setActiveTab('content')}><span className="nav-icon">📝</span><span>Contenu</span></button>
    </nav>

    {/* MODALS & CONFIRM DIALOG */}
    
    {addMemberModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Ajouter un nouveau membre</h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const nom = (document.getElementById('newMemNom') as HTMLInputElement).value;
                    const email = (document.getElementById('newMemEmail') as HTMLInputElement).value;
                    const password = (document.getElementById('newMemPwd') as HTMLInputElement).value;
                    const tel = (document.getElementById('newMemTel') as HTMLInputElement).value;
                    const role = (document.getElementById('newMemRole') as HTMLSelectElement).value;
                    const cat = (document.getElementById('newMemCat') as HTMLSelectElement).value;
                    
                    if(nom && email && password) {
                        try {
                            // Create user in Firebase Auth without logging out current admin
                            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                            
                            // Save to Firestore with the same UID
                            await setDoc(doc(db, 'users', userCred.user.uid), {
                                nom, email, telephone: tel, role, categorie: cat, statut: 'actif', createdAt: serverTimestamp()
                            });
                            setAddMemberModalOpen(false);
                        } catch(err: any) {
                            alert("Erreur lors de la création du compte : " + err.message);
                        }
                    }
                }}>
                    <div className="form-group"><label>Nom complet</label><input type="text" id="newMemNom" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Email</label><input type="email" id="newMemEmail" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Mot de passe</label><input type="password" id="newMemPwd" required style={{ width: '100%', padding: '8px' }} minLength={6} /></div>
                    <div className="form-group"><label>Téléphone</label><input type="text" id="newMemTel" style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Rôle</label>
                            <select id="newMemRole" style={{ width: '100%', padding: '8px' }}>
                                <option value="member">Membre standard</option>
                                <option value="president">Président</option>
                                <option value="vice_president">Vice-Président</option>
                                <option value="secretaire">Secrétaire Général</option>
                                <option value="tresorier">Trésorier</option>
                                <option value="communicateur">Communicateur</option>
                                <option value="conseiller">Conseiller</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Catégorie</label>
                            <select id="newMemCat" style={{ width: '100%', padding: '8px' }}>
                                <option value="actif">Actif</option>
                                <option value="bienfaiteur">Bienfaiteur</option>
                                <option value="fondateur">Fondateur</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" className="btn btn-primary">Créer le compte</button>
                        <button type="button" className="btn btn-outline" onClick={() => setAddMemberModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )}

    {memberModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>{memberModal.nom}</h3>
                <p>Email: {memberModal.email || '-'}</p>
                <p>Téléphone: {memberModal.telephone || '-'}</p>
                <p>Statut: {memberModal.statut}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button className="btn btn-primary" onClick={() => setMemberModal(null)}>Fermer</button>
                    {memberModal.telephone && <a href={`https://wa.me/${memberModal.telephone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="btn btn-success">WhatsApp</a>}
                </div>
            </div>
        </div>
    )}

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
