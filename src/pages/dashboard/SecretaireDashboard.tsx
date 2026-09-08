import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, deleteDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';
import { db, auth, storage } from '../../lib/firebase';
import './SecretaireDashboard.css';

export const SecretaireDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Filters
  const [memberFilter, setMemberFilter] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [docFilter, setDocFilter] = useState('all');
  const [docSearch, setDocSearch] = useState('');
  const [pvFilter, setPvFilter] = useState('all');
  const [convoFilter, setConvoFilter] = useState('all');
  const [modFilter, setModFilter] = useState('pending');

  // Modals
  const [pvModalOpen, setPvModalOpen] = useState(false);
  const [convoModalOpen, setConvoModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [memberModalOpen, setMemberModalOpen] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: () => {} });

  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Data State
  const [members, setMembers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [pv, setPv] = useState<any[]>([]);
  const [convocations, setConvocations] = useState<any[]>([]);
  const [moderation, setModeration] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [suppleanceHistory, setSuppleanceHistory] = useState<any[]>([]);
  const [isSuppleanceActive, setIsSuppleanceActive] = useState(false);

  const [courriers, setCourriers] = useState<any[]>([]);

  // Real-time Listeners
  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDocs = onSnapshot(query(collection(db, 'documents'), orderBy('uploadedAt', 'desc')), (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPV = onSnapshot(query(collection(db, 'pv'), orderBy('createdAt', 'desc')), (snap) => setPv(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubConvos = onSnapshot(query(collection(db, 'convocations'), orderBy('sentAt', 'desc')), (snap) => setConvocations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMod = onSnapshot(query(collection(db, 'moderation'), orderBy('createdAt', 'desc')), (snap) => setModeration(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBoardMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCommissions = onSnapshot(query(collection(db, 'commissions'), orderBy('createdAt', 'desc')), (snap) => setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleance = onSnapshot(query(collection(db, 'suppleance_history'), orderBy('date', 'desc')), (snap) => setSuppleanceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleanceState = onSnapshot(doc(db, 'system', 'suppleance'), (docSnap) => {
      if (docSnap.exists()) setIsSuppleanceActive(docSnap.data().active || false);
    });

    const unsubCourriers = onSnapshot(query(collection(db, 'courriers'), orderBy('date', 'desc')), (snap) => setCourriers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMeetings = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc')), (snap) => setMeetings(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubMembers(); unsubDocs(); unsubPV(); unsubConvos(); unsubMod(); unsubMeetings(); unsubBoardMessages(); unsubTasks(); unsubCourriers(); unsubCommissions(); unsubSuppleance(); unsubSuppleanceState(); };
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

  // Computed Stats
  const pendingPV = pv.filter(p => p.status === 'draft' || p.status === 'pending').length;
  const upcomingConvos = convocations.filter(c => c.status === 'sent' && c.date && new Date(c.date.seconds ? c.date.toDate() : c.date) > new Date()).length;
  const pendingMod = moderation.filter(m => m.status === 'pending').length;
  const totalNotifs = pendingPV + pendingMod;

  // ACTIONS: PV
    const toggleSuppleance = async () => {
      confirmAction('Modifier le mode suppléance ?', async () => {
          await setDoc(doc(db, 'system', 'suppleance'), { active: !isSuppleanceActive, updatedAt: serverTimestamp() }, { merge: true });
          if (!isSuppleanceActive) {
            await addDoc(collection(db, 'suppleance_history'), {
                date: new Date(),
                raison: 'Activation par le Secrétaire',
                activatedAt: serverTimestamp()
            });
          }
      });
  };

  const savePV = async (e: React.FormEvent) => {
    e.preventDefault();
    const meetingId = (document.getElementById('pvMeeting') as HTMLSelectElement).value;
    const meeting = meetings.find(m => m.id === meetingId);
    
    const data = {
        meetingId,
        meetingTitle: meeting ? meeting.titre : 'Réunion',
        date: new Date((document.getElementById('pvDate') as HTMLInputElement).value),
        location: (document.getElementById('pvLocation') as HTMLInputElement).value,
        attendees: (document.getElementById('pvAttendees') as HTMLTextAreaElement).value,
        agenda: (document.getElementById('pvAgenda') as HTMLTextAreaElement).value,
        content: (document.getElementById('pvContent') as HTMLTextAreaElement).value,
        decisions: (document.getElementById('pvDecisions') as HTMLTextAreaElement).value,
        status: 'draft',
        createdBy: 'secretary',
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'pv'), data);
    setPvModalOpen(false);
  };

  const submitPV = (id: string) => {
      confirmAction('📤 Soumettre ce PV pour signature du Président ?', async () => {
          await updateDoc(doc(db, 'pv', id), { status: 'pending', submittedAt: serverTimestamp() });
      });
  };

  const signPV = (id: string) => {
      confirmAction('✍️ Co-signer ce PV avec le Président ?', async () => {
          await updateDoc(doc(db, 'pv', id), { status: 'signed', signedBySecretary: true, signedAt: serverTimestamp() });
      });
  };

  // ACTIONS: CONVOCATIONS
  const saveConvo = async (e: React.FormEvent) => {
      e.preventDefault();
      const type = (document.getElementById('convoType') as HTMLSelectElement).value;
      const date = new Date((document.getElementById('convoDate') as HTMLInputElement).value);
      const data = {
          type, date,
          time: (document.getElementById('convoTime') as HTMLInputElement).value,
          location: (document.getElementById('convoLocation') as HTMLInputElement).value,
          agenda: (document.getElementById('convoAgenda') as HTMLTextAreaElement).value,
          recipients: (document.getElementById('convoRecipients') as HTMLSelectElement).value,
          title: `Convocation ${type === 'bureau' ? 'Bureau' : type === 'ag_ordinaire' ? 'AG Ordinaire' : 'AG Extraordinaire'} - ${formatDate(date)}`,
          status: 'sent',
          createdBy: 'secretary',
          sentAt: serverTimestamp()
      };
      await addDoc(collection(db, 'convocations'), data);
      setConvoModalOpen(false);
  };

  // ACTIONS: DOCUMENTS
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const saveDocument = async (e: React.FormEvent) => {
      e.preventDefault();
      const dateVal = (document.getElementById('docDate') as HTMLInputElement).value;
      const data: any = {
          title: (document.getElementById('docTitle') as HTMLInputElement).value,
          category: (document.getElementById('docCategory') as HTMLSelectElement).value,
          date: dateVal ? new Date(dateVal) : new Date(),
          description: (document.getElementById('docDescription') as HTMLTextAreaElement).value,
          confidential: (document.getElementById('docConfidential') as HTMLInputElement).checked,
          uploadedBy: 'secretary',
          uploadedAt: serverTimestamp()
      };

      if (selectedFile) {
          try {
              const storageRef = ref(storage, `documents/${Date.now()}_${selectedFile.name}`);
              await uploadBytes(storageRef, selectedFile);
              data.fileUrl = await getDownloadURL(storageRef);
              data.size = `${(selectedFile.size / 1024).toFixed(1)} KB`;
          } catch (err) {
              console.error(err);
              alert("Erreur lors de l'upload du fichier");
          }
      }

      await addDoc(collection(db, 'documents'), data);
      setUploadModalOpen(false);
      setSelectedFile(null);
  };

  const deleteDocument = (id: string) => {
      confirmAction('️ Supprimer ce document des archives ?', async () => {
          await deleteDoc(doc(db, 'documents', id));
      });
  };

  // ACTIONS: MODERATION
  const approveModeration = async (id: string) => {
      await updateDoc(doc(db, 'moderation', id), { status: 'approved', moderatedBy: 'secretary', moderatedAt: serverTimestamp() });
  };
  const rejectModeration = async (id: string) => {
      const reason = prompt('Motif du refus :');
      if (!reason) return;
      await updateDoc(doc(db, 'moderation', id), { status: 'rejected', rejectionReason: reason, moderatedBy: 'secretary', moderatedAt: serverTimestamp() });
  };

  return (
    <div className="sec-dashboard-container">
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
                      <button className="header-btn" onClick={() => setShowNotifPanel(!showNotifPanel)}>
                          🔔 {totalNotifs > 0 && <span className="notif-badge">{totalNotifs}</span>}
                      </button>
                      {showNotifPanel && (
                          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '280px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 50, padding: '16px', color: '#1a1a1a' }}>
                              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>🔔 Notifications</h4>
                              {pendingPV > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#B45309', cursor: 'pointer' }} onClick={() => { setActiveTab('pv'); setShowNotifPanel(false); }}>📝 {pendingPV} PV à traiter</div>}
                              {pendingMod > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#C62828', cursor: 'pointer' }} onClick={() => { setActiveTab('moderation'); setShowNotifPanel(false); }}>🛡️ {pendingMod} élément(s) à modérer</div>}
                              {upcomingConvos > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#1D4ED8', cursor: 'pointer' }} onClick={() => { setActiveTab('convocations'); setShowNotifPanel(false); }}>📬 {upcomingConvos} convocation(s) à venir</div>}
                              {totalNotifs === 0 && upcomingConvos === 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#666' }}>Aucune notification.</div>}
                          </div>
                      )}
                  </div>
                  <button className="header-btn" onClick={handleLogout}>🚪</button>
              </div>
          </div>
          <div className="member-info-bar">
              <div className="member-avatar">📋</div>
              <div className="member-details">
                  <div className="member-name">Secrétaire Général</div>
                  <div className="member-role">📋 Secrétaire Général du Bureau</div>
              </div>
              <div className="member-badge">Bureau</div>
          </div>
      </header>

      {/* TAB NAV */}
      <nav className="tab-nav" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '8px' }}>
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><span className="tab-icon">📊</span><span>Dashboard</span></button>
          <button className={`tab-btn ${activeTab === 'archives' ? 'active' : ''}`} onClick={() => setActiveTab('archives')}><span className="tab-icon">🗂️</span><span>Archives</span></button>
          <button className={`tab-btn ${activeTab === 'pv' ? 'active' : ''}`} onClick={() => setActiveTab('pv')}><span className="tab-icon">📝</span><span>PV & CR</span></button>
          <button className={`tab-btn ${activeTab === 'convocations' ? 'active' : ''}`} onClick={() => setActiveTab('convocations')}><span className="tab-icon">📬</span><span>Convocations</span></button>
          <button className={`tab-btn ${activeTab === 'courriers' ? 'active' : ''}`} onClick={() => setActiveTab('courriers')}><span className="tab-icon">📬</span><span>Courriers</span></button>
          <button className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => setActiveTab('commissions')}><span className="tab-icon">🏛️</span><span>Commissions</span></button>
          <button className={`tab-btn ${activeTab === 'suppleance' ? 'active' : ''}`} onClick={() => setActiveTab('suppleance')}><span className="tab-icon">⚡</span><span>Suppléance</span></button>
          <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}><span className="tab-icon">📋</span><span>Tâches</span></button>
          <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}><span className="tab-icon">💬</span><span>Messages</span></button>
          <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}><span className="tab-icon">👥</span><span>Membres</span></button>
          <button className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}><span className="tab-icon">🛡️</span><span>Modération</span></button>
      </nav>

      {/* TAB: DASHBOARD */}
      <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
          
      {isSuppleanceActive && (
          <div className="alert-box" style={{ background: '#fff3e0', borderColor: '#ff9800', marginBottom: '16px', margin: '0 16px' }}>
              <div className="alert-icon">⚡</div>
              <div className="alert-content">
                  <h4>Mode Suppléance Actif</h4>
                  <p>Le Président est actuellement suppléé.</p>
              </div>
          </div>
      )}

          <div className="welcome-card">
              <span className="role-badge">📋 Secrétaire Général</span>
              <h2>Bienvenue, Mr le Secrétaire Général </h2>
              <p>Vous assurez l'administration, les archives et la rédaction des PV de l'Association.</p>
          </div>

          <div className="stats-grid">
              <div className="stat-card" onClick={() => setActiveTab('archives')}><div className="stat-icon">🗂️</div><div className="stat-value">{documents.length}</div><div className="stat-label">Documents</div><div className="stat-sublabel">Archivés</div></div>
              <div className={`stat-card ${pendingPV > 0 ? 'alert' : ''}`} onClick={() => setActiveTab('pv')}><div className="stat-icon">📝</div><div className="stat-value">{pendingPV}</div><div className="stat-label">PV</div><div className="stat-sublabel">En attente</div></div>
              <div className="stat-card" onClick={() => setActiveTab('convocations')}><div className="stat-icon">📬</div><div className="stat-value">{upcomingConvos}</div><div className="stat-label">Convocations</div><div className="stat-sublabel">À venir</div></div>
              <div className={`stat-card ${pendingMod > 0 ? 'success' : ''}`} onClick={() => setActiveTab('moderation')}><div className="stat-icon">🛡️</div><div className="stat-value">{pendingMod}</div><div className="stat-label">Modération</div><div className="stat-sublabel">En attente</div></div>
          </div>

          <div>
              {pendingPV > 0 && <div className="alert-box warning"><div className="alert-icon">📝</div><div className="alert-content"><h4>{pendingPV} PV en attente</h4><p>Des procès-verbaux nécessitent votre rédaction ou signature.</p></div><button className="btn btn-outline btn-small" onClick={() => setActiveTab('pv')}>Voir →</button></div>}
              {upcomingConvos > 0 && <div className="alert-box info"><div className="alert-icon">📬</div><div className="alert-content"><h4>{upcomingConvos} convocation(s) à venir</h4><p>Vérifiez que les convocations ont été envoyées 7 jours avant (Art. 6 RI).</p></div><button className="btn btn-outline btn-small" onClick={() => setActiveTab('convocations')}>Voir →</button></div>}
              {pendingMod > 0 && <div className="alert-box danger"><div className="alert-icon">🛡️</div><div className="alert-content"><h4>{pendingMod} élément(s) à modérer</h4><p>Des commentaires ou demandes attendent votre validation.</p></div><button className="btn btn-outline btn-small" onClick={() => setActiveTab('moderation')}>Voir →</button></div>}
          </div>

          <div className="card">
              <div className="card-header"><h3 className="card-title">⚡ Actions rapides</h3></div>
              <div className="quick-actions">
                  <div className="quick-action" onClick={() => setPvModalOpen(true)}><div className="qa-icon">📝</div><div className="qa-title">Rédiger un PV</div></div>
                  <div className="quick-action" onClick={() => setConvoModalOpen(true)}><div className="qa-icon">📬</div><div className="qa-title">Convoquer</div></div>
                  <div className="quick-action" onClick={() => setUploadModalOpen(true)}><div className="qa-icon">📤</div><div className="qa-title">Archiver</div></div>
                  <div className="quick-action" onClick={() => setActiveTab('members')}><div className="qa-icon">👥</div><div className="qa-title">Fiches membres</div></div>
                  <div className="quick-action" onClick={() => setActiveTab('moderation')}><div className="qa-icon">🛡️</div><div className="qa-title">Modérer</div></div>
                  <div className="quick-action" onClick={() => setActiveTab('archives')}><div className="qa-icon">🗂️</div><div className="qa-title">Consulter archives</div></div>
              </div>
          </div>
      </div>

      {/* TAB: ARCHIVES */}
      <div className={`tab-content ${activeTab === 'archives' ? 'active' : ''}`}>
          <div className="section-header"><h2>🗂️ Gestion des Archives</h2></div>
          <button className="btn btn-gold btn-block" onClick={() => setUploadModalOpen(true)} style={{ marginBottom: '16px' }}>📤 Archiver un nouveau document</button>
          
          <div className="sub-tabs">
              {['all', 'statuts', 'pv', 'rapports', 'legal', 'correspondance'].map(f => (
                  <button key={f} className={`sub-tab ${docFilter === f ? 'active' : ''}`} onClick={() => setDocFilter(f)}>
                      {f === 'all' ? 'Tous' : f === 'statuts' ? '📜 Statuts' : f === 'pv' ? '📝 PV' : f === 'rapports' ? '📊 Rapports' : f === 'legal' ? '⚖️ Légal' : '✉️ Correspondance'}
                  </button>
              ))}
          </div>
          <div className="filters-bar"><input type="text" className="search-input" placeholder="Rechercher..." value={docSearch} onChange={(e) => setDocSearch(e.target.value)} /></div>
          
          <div>
              {documents.filter(d => (docFilter === 'all' || d.category === docFilter) && d.title.toLowerCase().includes(docSearch.toLowerCase())).map(d => (
                  <div key={d.id} className="document-item">
                      <div className="document-icon">📄</div>
                      <div className="document-info">
                          <div className="document-title">{d.title} {d.confidential ? '🔒' : ''}</div>
                          <div className="document-meta">{d.category} • {formatDate(d.date)} • {d.size || '-'}</div>
                      </div>
                      <div className="document-actions">
                          {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-small">👁️ Voir</a>}
                          <button className="btn btn-danger btn-small" onClick={() => deleteDocument(d.id)}>🗑️</button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* TAB: PV */}
      <div className={`tab-content ${activeTab === 'pv' ? 'active' : ''}`}>
          <div className="section-header"><h2>📝 Procès-Verbaux & Comptes Rendus</h2></div>
          <button className="btn btn-gold btn-block" onClick={() => setPvModalOpen(true)} style={{ marginBottom: '16px' }}>✍️ Rédiger un nouveau PV</button>
          <div className="sub-tabs">
              <button className={`sub-tab ${pvFilter === 'all' ? 'active' : ''}`} onClick={() => setPvFilter('all')}>Tous</button>
              <button className={`sub-tab ${pvFilter === 'draft' ? 'active' : ''}`} onClick={() => setPvFilter('draft')}>📝 Brouillons</button>
              <button className={`sub-tab ${pvFilter === 'pending' ? 'active' : ''}`} onClick={() => setPvFilter('pending')}>⏳ En attente signature</button>
              <button className={`sub-tab ${pvFilter === 'signed' ? 'active' : ''}`} onClick={() => setPvFilter('signed')}>✅ Signés</button>
          </div>
          <div>
              {pv.filter(p => pvFilter === 'all' || p.status === pvFilter).map(p => (
                  <div key={p.id} className={`pv-item ${p.status}`}>
                      <div className="pv-header">
                          <div className="pv-title">{p.meetingTitle}</div>
                          <div className="pv-date">{formatDate(p.date)}</div>
                      </div>
                      <div className="pv-meeting">📍 {p.location} • 👥 {p.attendees}</div>
                      <div className="pv-status">
                          {p.status === 'draft' && <span className="badge badge-warning">📝 Brouillon</span>}
                          {p.status === 'pending' && <span className="badge badge-info">⏳ En attente</span>}
                          {p.status === 'signed' && <span className="badge badge-success">✅ Signé</span>}
                      </div>
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                          {p.status === 'draft' && <button className="btn btn-success btn-small" onClick={() => submitPV(p.id)}>📤 Soumettre signature</button>}
                          {p.status === 'pending' && <button className="btn btn-gold btn-small" onClick={() => signPV(p.id)}>✍️ Co-signer</button>}
                          <button className="btn btn-outline btn-small" onClick={() => alert(`PV: ${p.meetingTitle}\n\n${p.content}`)}>👁️ Voir</button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* TAB: CONVOCATIONS */}
      <div className={`tab-content ${activeTab === 'convocations' ? 'active' : ''}`}>
          <div className="section-header"><h2>📬 Gestion des Convocations</h2></div>
          <button className="btn btn-gold btn-block" onClick={() => setConvoModalOpen(true)} style={{ marginBottom: '16px' }}>📤 Créer convocation</button>
          <div className="sub-tabs">
              <button className={`sub-tab ${convoFilter === 'all' ? 'active' : ''}`} onClick={() => setConvoFilter('all')}>Toutes</button>
              <button className={`sub-tab ${convoFilter === 'ag' ? 'active' : ''}`} onClick={() => setConvoFilter('ag')}>🏛️ AG</button>
              <button className={`sub-tab ${convoFilter === 'bureau' ? 'active' : ''}`} onClick={() => setConvoFilter('bureau')}>👔 Bureau</button>
          </div>
          <div>
              {convocations.filter(c => convoFilter === 'all' || (convoFilter === 'ag' && c.type?.startsWith('ag')) || c.type === convoFilter).map(c => (
                  <div key={c.id} className="convo-item">
                      <div className="convo-header"><div className="convo-title">{c.title}</div><div className="convo-date">{formatDate(c.date)} à {c.time}</div></div>
                      <div className="convo-recipients">{c.location} • 👥 {c.recipients}</div>
                      <div style={{ marginTop: '8px' }}><span className="badge badge-success">📤 Envoyée</span></div>
                  </div>
              ))}
          </div>
      </div>

      {/* TAB: MEMBERS */}
      <div className={`tab-content ${activeTab === 'members' ? 'active' : ''}`}>
          <div className="section-header"><h2>👥 Fiches Membres</h2></div>
          <div className="sub-tabs">
              <button className={`sub-tab ${memberFilter === 'all' ? 'active' : ''}`} onClick={() => setMemberFilter('all')}>Tous</button>
              <button className={`sub-tab ${memberFilter === 'actif' ? 'active' : ''}`} onClick={() => setMemberFilter('actif')}>✅ Actifs</button>
              <button className={`sub-tab ${memberFilter === 'bienfaiteur' ? 'active' : ''}`} onClick={() => setMemberFilter('bienfaiteur')}>💛 Bienfaiteurs</button>
              <button className={`sub-tab ${memberFilter === 'fondateur' ? 'active' : ''}`} onClick={() => setMemberFilter('fondateur')}>⭐ Fondateurs</button>
          </div>
          <div className="filters-bar"><input type="text" className="search-input" placeholder="Rechercher un membre..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} /></div>
          <div>
              {members.filter(m => (memberFilter === 'all' || m.categorie === memberFilter) && (m.nom?.toLowerCase() || '').includes(memberSearch.toLowerCase())).map(m => (
                  <div key={m.id} className="document-item">
                      <div className="document-icon">{m.nom?.substring(0,2).toUpperCase() || 'IK'}</div>
                      <div className="document-info">
                          <div className="document-title">{m.nom}</div>
                          <div className="document-meta">{m.email || m.telephone || '-'} • {m.categorie}</div>
                      </div>
                      <div className="document-actions">
                          <button className="btn btn-outline btn-small" onClick={() => setMemberModalOpen(m)}>👁️ Voir</button>
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* TAB: MODERATION */}
      <div className={`tab-content ${activeTab === 'moderation' ? 'active' : ''}`}>
          <div className="section-header"><h2>🛡️ Modération</h2></div>
          <div className="sub-tabs">
              <button className={`sub-tab ${modFilter === 'pending' ? 'active' : ''}`} onClick={() => setModFilter('pending')}>⏳ En attente</button>
              <button className={`sub-tab ${modFilter === 'approved' ? 'active' : ''}`} onClick={() => setModFilter('approved')}>✅ Approuvés</button>
              <button className={`sub-tab ${modFilter === 'rejected' ? 'active' : ''}`} onClick={() => setModFilter('rejected')}>❌ Refusés</button>
              <button className={`sub-tab ${modFilter === 'all' ? 'active' : ''}`} onClick={() => setModFilter('all')}>Tous</button>
          </div>
          <div>
              {moderation.filter(m => modFilter === 'all' || m.status === modFilter).map(m => (
                  <div key={m.id} className={`moderation-item ${m.status}`}>
                      <div className="moderation-header"><div className="moderation-author">{m.type} - {m.author}</div><div className="moderation-date">{formatDate(m.createdAt || m.date)}</div></div>
                      <div className="moderation-content">{m.content}</div>
                      {m.status === 'pending' ? (
                          <div className="moderation-actions">
                              <button className="btn btn-success btn-small" onClick={() => approveModeration(m.id)}>✅ Approuver</button>
                              <button className="btn btn-danger btn-small" onClick={() => rejectModeration(m.id)}>❌ Refuser</button>
                          </div>
                      ) : (
                          <div className="moderation-actions"><span className={`badge ${m.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>{m.status === 'approved' ? '✅ Approuvé' : '❌ Refusé'}</span></div>
                      )}
                  </div>
              ))}
          </div>
      </div>

      {/* TAB COURRIERS */}
      <div className={`tab-content ${activeTab === 'courriers' ? 'active' : ''}`}>
        <div className="section-header"><h2>📬 Courrier (Entrant / Sortant)</h2><p>Registre officiel des correspondances</p></div>
        <div className="card">
            {courriers.map(c => (
                <div key={c.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{c.objet}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>{c.type === 'entrant' ? 'Reçu le' : 'Envoyé le'} {new Date(c.date?.seconds * 1000).toLocaleDateString('fr-FR')} • {c.expediteur_destinataire}</div>
                    </div>
                    <span className={`badge ${c.type === 'entrant' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{c.type === 'entrant' ? 'Entrant' : 'Sortant'}</span>
                </div>
            ))}
            {courriers.length === 0 && <div className="empty-state">Aucun courrier enregistré.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const obj = (document.getElementById('cObjet') as HTMLInputElement).value;
                const tiers = (document.getElementById('cTiers') as HTMLInputElement).value;
                const type = (document.getElementById('cType') as HTMLInputElement).value;
                if(obj && tiers) {
                    await addDoc(collection(db, 'courriers'), { objet: obj, expediteur_destinataire: tiers, type, date: serverTimestamp() });
                    e.target.reset();
                }
            }} style={{ marginTop: '20px' }}>
                <h3 className="card-title">Enregistrer un courrier</h3>
                <div className="form-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input type="text" id="cObjet" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Objet du courrier" required />
                    <input type="text" id="cTiers" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Expéditeur / Destinataire" required />
                    <select id="cType" className="search-input" style={{ width: 'auto', padding: '8px' }}>
                        <option value="entrant">Entrant</option>
                        <option value="sortant">Sortant</option>
                    </select>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Ajouter</button>
                </div>
            </form>
        </div>
      </div>

      
      {/* TAB COMMISSIONS */}
      <div className={`tab-content ${activeTab === 'commissions' ? 'active' : ''}`}>
        <div className="section-header"><h2>🏛️ Commissions & Projets</h2><p>Gestion des comités de l'association</p></div>
        <div className="card">
            <h3 className="card-title">Liste des Commissions</h3>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {commissions.length > 0 ? commissions.map(c => (
                    <div key={c.id} className="stat-card">
                        <div className="stat-label" style={{ fontSize: '16px', fontWeight: 'bold' }}>{c.name}</div>
                        <div className="stat-sublabel">Resp: {c.lead}</div>
                        <div className="stat-value" style={{ fontSize: '18px', marginTop: '8px' }}>{c.status || 'Actif'}</div>
                        <button className="btn btn-outline btn-small" style={{ marginTop: '8px' }} onClick={async () => {
                             await updateDoc(doc(db, 'commissions', c.id), { status: c.status === 'Actif' ? 'Inactif' : 'Actif' });
                        }}>{c.status === 'Actif' ? 'Désactiver' : 'Activer'}</button>
                    </div>
                )) : (
                    <div className="empty-state" style={{ gridColumn: '1 / -1' }}>Aucune commission enregistrée</div>
                )}
            </div>
            <form onSubmit={async (e) => {
                e.preventDefault();
                const name = (document.getElementById('secComName') as HTMLInputElement).value;
                const lead = (document.getElementById('secComLead') as HTMLInputElement).value;
                if(name && lead) {
                    await addDoc(collection(db, 'commissions'), { name, lead, status: 'Actif', createdAt: serverTimestamp() });
                    (e.target as HTMLFormElement).reset();
                }
            }} style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <h3 className="card-title">Créer une commission</h3>
                <div className="form-row">
                    <input type="text" id="secComName" placeholder="Nom de la commission" className="search-input" required />
                    <input type="text" id="secComLead" placeholder="Responsable" className="search-input" required />
                    <button type="submit" className="btn btn-primary">Créer</button>
                </div>
            </form>
        </div>
      </div>

      {/* TAB SUPPLEANCE */}
      <div className={`tab-content ${activeTab === 'suppleance' ? 'active' : ''}`}>
        <div className="section-header"><h2>⚡ Mode Suppléance</h2><p>Gestion et historique du mode suppléance</p></div>
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Statut actuel : {isSuppleanceActive ? '🟢 Actif' : '⚪ Inactif'}</h3>
                    <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Le mode suppléance permet au VP de remplacer le Président.</p>
                </div>
                <button className={`btn ${isSuppleanceActive ? 'btn-outline' : 'btn-gold'}`} onClick={toggleSuppleance}>
                    {isSuppleanceActive ? 'Désactiver' : 'Activer le mode'}
                </button>
            </div>
        </div>
        
        <div className="card">
            <h3 className="card-title">📜 Historique des suppléances</h3>
            {suppleanceHistory.length === 0 ? <div className="empty-state"><h3>Aucun historique</h3></div> : (
                suppleanceHistory.map(s => (
                    <div key={s.id} className="report-card">
                        <div className="report-icon">⚡</div>
                        <div className="report-details">
                            <div className="report-title">Suppléance activée</div>
                            <div className="report-meta">Date: {formatDate(s.date)} • {s.raison || 'Sans motif'}</div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* TAB TASKS */}
      <div className={`tab-content ${activeTab === 'tasks' ? 'active' : ''}`}>
        <div className="section-header"><h2>📋 Tâches & Délégation</h2><p>Gestion des tâches du bureau</p></div>

        <div className="card" style={{ marginBottom: '16px' }}>
            <h3 className="card-title">Nouvelle tâche</h3>
            <form onSubmit={async (e) => {
                e.preventDefault();
                const title = (document.getElementById('secTaskTitle') as HTMLInputElement).value;
                const desc = (document.getElementById('secTaskDesc') as HTMLTextAreaElement).value;
                const assigned = (document.getElementById('secTaskAssign') as HTMLSelectElement).value;
                if(title) {
                    await addDoc(collection(db, 'tasks'), {
                        title, description: desc, assignedTo: assigned, completed: false, createdBy: 'secretaire', createdAt: serverTimestamp()
                    });
                    (e.target as HTMLFormElement).reset();
                }
            }}>
                <div className="form-group"><input type="text" id="secTaskTitle" placeholder="Titre de la tâche" required style={{ width: '100%', padding: '8px' }} /></div>
                <div className="form-group"><textarea id="secTaskDesc" placeholder="Description" rows={2} style={{ width: '100%', padding: '8px' }}></textarea></div>
                <div className="form-row">
                    <select id="secTaskAssign" style={{ padding: '8px', flex: 1 }}>
                        <option value="secretaire">Moi-même (Secrétaire)</option>
                        <option value="president">Président</option>
                        <option value="vice_president">Vice-Président</option>
                        <option value="tresorier">Trésorier</option>
                        <option value="communicateur">Communicateur</option>
                        <option value="conseiller">Conseiller</option>
                    </select>
                    <button type="submit" className="btn btn-primary">Assigner</button>
                </div>
            </form>
        </div>

        <div className="card">
            {tasks.map(t => (
                <div key={t.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{t.title}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>Assigné à: {t.assignedTo} | Par: {t.createdBy}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>{t.description}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span className={`badge ${t.completed ? 'badge-success' : 'badge-warning'}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{t.completed ? 'Terminé' : 'En cours'}</span>
                        <button className="btn btn-outline btn-small" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={async () => {
                            await updateDoc(doc(db, 'tasks', t.id), { completed: !t.completed, completedAt: !t.completed ? serverTimestamp() : null });
                        }}>
                            {t.completed ? 'Rouvrir' : 'Terminer'}
                        </button>
                    </div>
                </div>
            ))}
            {tasks.length === 0 && <div className="empty-state">Aucune tâche assignée.</div>}
        </div>
      </div>

      {/* TAB MESSAGES */}
      <div className={`tab-content ${activeTab === 'messages' ? 'active' : ''}`}>
        <div className="section-header" style={{ marginBottom: '8px', padding: '0 16px' }}><h2>💬 Chat Bureau</h2><p>Boîte de réception centralisée</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh', minHeight: '500px', padding: 0, overflow: 'hidden', background: '#efeae2', borderRadius: '12px' }}>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {boardMessages.map(m => {
                    const isMe = m.role === 'secretaire';
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
                    id="secChatMsg" 
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
                            const input = document.getElementById('secChatMsg') as HTMLTextAreaElement;
                            if(input.value.trim()) {
                                await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Secrétaire Général', role: 'secretaire', timestamp: serverTimestamp() });
                                input.value = '';
                                input.style.height = 'auto';
                            }
                        }
                    }}
                />
                <button 
                    onClick={async () => {
                        const input = document.getElementById('secChatMsg') as HTMLTextAreaElement;
                        if(input.value.trim()) {
                            await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Secrétaire Général', role: 'secretaire', timestamp: serverTimestamp() });
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

      {/* BOTTOM NAV */}
      <nav className="bottom-nav" style={{ overflowX: 'auto', whiteSpace: 'nowrap', display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
          <button style={{ minWidth: '80px', flex: '0 0 auto' }} className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}><span className="nav-icon">📊</span><span>Dash</span></button>
          <button className={activeTab === 'courriers' ? 'active' : ''} onClick={() => setActiveTab('courriers')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">📬</span><span>Courriers</span></button>
          <button className={activeTab === 'commissions' ? 'active' : ''} onClick={() => setActiveTab('commissions')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">🏛️</span><span>Comm.</span></button>
          <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">📋</span><span>Tâches</span></button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💬</span><span>Messages</span></button>
          <button className={activeTab === 'archives' ? 'active' : ''} onClick={() => setActiveTab('archives')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">🗂️</span><span>Archives</span></button>
          <button style={{ minWidth: '80px', flex: '0 0 auto' }} className={activeTab === 'pv' ? 'active' : ''} onClick={() => setActiveTab('pv')}><span className="nav-icon">📝</span><span>PV</span></button>
          <button style={{ minWidth: '80px', flex: '0 0 auto' }} className={activeTab === 'convocations' ? 'active' : ''} onClick={() => setActiveTab('convocations')}><span className="nav-icon">📬</span><span>Convoc.</span></button>
      </nav>

      {/* MODALS */}
      {pvModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Rédiger un PV</h3>
                  <form onSubmit={savePV}>
                      <div className="form-group"><label>Réunion associée</label><select id="pvMeeting" required><option value="">-- Choisir une réunion --</option>{meetings.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}</select></div>
                      <div className="form-row">
                          <div className="form-group"><label>Date</label><input type="date" id="pvDate" required /></div>
                          <div className="form-group"><label>Lieu</label><input type="text" id="pvLocation" defaultValue="Siège social" required /></div>
                      </div>
                      <div className="form-group"><label>Présents</label><textarea id="pvAttendees" rows={2} required></textarea></div>
                      <div className="form-group"><label>Ordre du jour</label><textarea id="pvAgenda" rows={2} required></textarea></div>
                      <div className="form-group"><label>Contenu</label><textarea id="pvContent" rows={5} required></textarea></div>
                      <div className="form-group"><label>Décisions</label><textarea id="pvDecisions" rows={2}></textarea></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn btn-gold">Enregistrer</button>
                          <button type="button" className="btn btn-outline" onClick={() => setPvModalOpen(false)}>Annuler</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {convoModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Créer une Convocation</h3>
                  <form onSubmit={saveConvo}>
                      <div className="form-group"><label>Type</label><select id="convoType" required><option value="bureau">Bureau</option><option value="ag_ordinaire">AG Ordinaire</option></select></div>
                      <div className="form-row">
                          <div className="form-group"><label>Date</label><input type="date" id="convoDate" required /></div>
                          <div className="form-group"><label>Heure</label><input type="time" id="convoTime" required /></div>
                      </div>
                      <div className="form-group"><label>Lieu</label><input type="text" id="convoLocation" defaultValue="Siège social" required /></div>
                      <div className="form-group"><label>Ordre du jour</label><textarea id="convoAgenda" rows={3} required></textarea></div>
                      <div className="form-group"><label>Destinataires</label><select id="convoRecipients" required><option value="bureau">Bureau</option><option value="all_members">Tous les membres</option></select></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn btn-gold">Envoyer</button>
                          <button type="button" className="btn btn-outline" onClick={() => setConvoModalOpen(false)}>Annuler</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {uploadModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Archiver un Document</h3>
                  <form onSubmit={saveDocument}>
                      <div className="form-group"><label>Titre</label><input type="text" id="docTitle" required /></div>
                      <div className="form-row">
                          <div className="form-group"><label>Catégorie</label><select id="docCategory" required><option value="statuts">Statuts & RI</option><option value="pv">PV</option><option value="rapports">Rapports</option><option value="legal">Légal</option></select></div>
                          <div className="form-group"><label>Date</label><input type="date" id="docDate" required /></div>
                      </div>
                      <div className="form-group"><label>Description</label><textarea id="docDescription" rows={2}></textarea></div>
                      <div className="form-group">
                          <label>Fichier</label>
                          <input type="file" onChange={handleFileSelect} required className="search-input" style={{ backgroundImage: 'none', paddingLeft: '12px' }} />
                          {selectedFile && <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--bleu-rca)' }}>Fichier sélectionné : {selectedFile.name}</div>}
                      </div>
                      <div className="checkbox-group">
                          <input type="checkbox" id="docConfidential" />
                          <label htmlFor="docConfidential">Document confidentiel (accès Bureau uniquement)</label>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn btn-gold">Archiver</button>
                          <button type="button" className="btn btn-outline" onClick={() => setUploadModalOpen(false)}>Annuler</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {memberModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '100%', padding: '24px', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bleu-rca)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', margin: '0 auto 12px' }}>
                      {memberModalOpen.nom?.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 style={{ color: 'var(--bleu-rca)', marginTop: 0 }}>{memberModalOpen.nom}</h3>
                  <div style={{ margin: '16px 0', textAlign: 'left', background: 'var(--fond-alterne)', padding: '16px', borderRadius: '8px' }}>
                      <p><strong>Email:</strong> {memberModalOpen.email || '-'}</p>
                      <p><strong>Tel:</strong> {memberModalOpen.telephone || '-'}</p>
                      <p><strong>Catégorie:</strong> {memberModalOpen.categorie || '-'}</p>
                      <p><strong>Statut:</strong> {memberModalOpen.statut || '-'}</p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setMemberModalOpen(null)}>Fermer</button>
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
