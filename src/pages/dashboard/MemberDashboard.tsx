import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../../styles/membre.css';
import { MemberVoting } from '../member/MemberVoting';

export const MemberDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [news, setNews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [missionsBenevolat, setMissionsBenevolat] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userData?.uid) return;

    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc')), (snap) => {
      setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((n: any) => n.status === 'publie'));
    });
    
    const unsubMissions = onSnapshot(query(collection(db, 'missions_benevolat'), orderBy('createdAt', 'desc')), (snap) => {
      setMissionsBenevolat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubPayments = onSnapshot(query(collection(db, 'finances'), where('type', '==', 'recette'), where('memberId', '==', userData.uid), orderBy('date', 'desc')), (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubForum = onSnapshot(query(collection(db, 'forum'), orderBy('createdAt', 'desc')), (snap) => setForumPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEvents = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc')), (snap) => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDocs = onSnapshot(query(collection(db, 'documents'), orderBy('createdAt', 'desc')), (snap) => {
       setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubNews();
      unsubPayments();
      unsubDocs(); unsubForum(); unsubEvents();
    };
  }, [userData?.uid]);

  const isUpToDate = userData?.statut === 'a_jour' || userData?.statut === 'actif';
  const totalPaid = payments.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);
  const memberSinceYear = userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).getFullYear() : new Date().getFullYear();
  const yearsMember = new Date().getFullYear() - memberSinceYear + 1;

  const handleLogout = async () => {
    if (window.confirm('🚪 Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await signOut(auth);
      navigate('/');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '-'; }
  };

  return (
    <div className="membre-page">
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
            <button className="header-btn" onClick={() => setActiveTab('notifications')} aria-label="Notifications">
              🔔
              {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
            </button>
            <button className="header-btn" onClick={handleLogout} aria-label="Déconnexion">🚪</button>
          </div>
        </div>
        <div className="member-info-bar">
          <div className="member-avatar">
            {userData?.nom ? userData.nom.substring(0, 2).toUpperCase() : 'MB'}
          </div>
          <div className="member-details">
            <div className="member-name">{userData?.nom || userData?.displayName}</div>
            <div className="member-role">{userData?.categorie || 'Membre Actif'}</div>
          </div>
          <div className={`member-badge ${isUpToDate ? '' : 'en-retard'}`}>
            {isUpToDate ? '✓ À jour' : '⚠️ En retard'}
          </div>
        </div>
      </header>

      {/* TAB NAV */}
      <nav className="tab-nav">
        <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); window.scrollTo(0,0); }}>
          <span className="tab-icon">🏠</span>
          <span>Accueil</span>
        </button>
        <button className={`tab-btn ${activeTab === 'carte' ? 'active' : ''}`} onClick={() => { setActiveTab('carte'); window.scrollTo(0,0); }}>
          <span className="tab-icon">🎫</span>
          <span>Ma Carte</span>
        </button>
        <button className={`tab-btn ${activeTab === 'cotisations' ? 'active' : ''}`} onClick={() => { setActiveTab('cotisations'); window.scrollTo(0,0); }}>
          <span className="tab-icon">💰</span>
          <span>Cotisations</span>
        </button>
        <button className={`tab-btn ${activeTab === 'benevolat' ? 'active' : ''}`} onClick={() => { setActiveTab('benevolat'); window.scrollTo(0,0); }}>
          <span className="tab-icon">🤝</span>
          <span>Bénévolat</span>
        </button>
        <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => { setActiveTab('documents'); window.scrollTo(0,0); }}>
          <span className="tab-icon">📄</span>
          <span>Documents</span>
        </button>
        <button className={`tab-btn ${activeTab === 'droits' ? 'active' : ''}`} onClick={() => { setActiveTab('droits'); window.scrollTo(0,0); }}>
          <span className="tab-icon">⚖️</span>
          <span>Mes Droits</span>
        </button>
      </nav>

      {/* TAB 1: DASHBOARD */}
      <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
        <div className="welcome-card">
          <span className="role-badge">👤 {userData?.role?.replace('_', ' ') || 'Membre'}</span>
          <h2>Bienvenue, {userData?.nom?.split(' ')[0] || 'Membre'} 👋</h2>
          <p>Merci pour votre engagement au sein de l'Association I KOUE GUI A ITA.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card success" onClick={() => setActiveTab('cotisations')}>
            <div className="stat-icon">💰</div>
            <div className="stat-value">{totalPaid.toLocaleString()} F</div>
            <div className="stat-label">Total payé</div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('carte')}>
            <div className="stat-icon">📅</div>
            <div className="stat-value">{yearsMember}</div>
            <div className="stat-label">Année(s)</div>
          </div>
          <div className="stat-card" onClick={() => setActiveTab('documents')}>
            <div className="stat-icon">📄</div>
            <div className="stat-value">{documents.length}</div>
            <div className="stat-label">Documents</div>
          </div>
        </div>

        {!isUpToDate && (
          <div className="alert-box danger">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h4>Cotisation en retard</h4>
              <p>Veuillez régulariser votre situation pour conserver votre droit de vote (Art. 8 RI).</p>
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Actions rapides</h3>
          </div>
          <div className="quick-actions">
            <div className="quick-action" onClick={() => setActiveTab('cotisations')}>
              <div className="qa-icon">💰</div>
              <div className="qa-title">Payer cotisation</div>
              <div className="qa-subtitle">Mobile Money</div>
            </div>
            <div className="quick-action" onClick={() => setActiveTab('carte')}>
              <div className="qa-icon">🎫</div>
              <div className="qa-title">Ma carte</div>
              <div className="qa-subtitle">Télécharger PDF</div>
            </div>
            <div className="quick-action" onClick={() => setActiveTab('droits')}>
              <div className="qa-icon">🗳️</div>
              <div className="qa-title">Voter en ligne</div>
              <div className="qa-subtitle">Art. 8 RI</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📜 Rappels Statutaires</h3>
          </div>
          <ul style={{ fontSize: '14px', color: 'var(--texte-principal)', paddingLeft: '20px', lineHeight: '1.8' }}>
            <li><strong>Art. 8 Statuts :</strong> 4 catégories de membres (Fondateur, Actif, Bienfaiteur, Honneur)</li>
            <li><strong>Art. 4 RI :</strong> Droits du membre (vote, éligibilité, information)</li>
            <li><strong>Art. 5 RI :</strong> Devoirs du membre (cotisation, participation)</li>
            <li><strong>Art. 6 RI :</strong> Convocation AG 7 jours avant</li>
            <li><strong>Art. 8 RI :</strong> Droit de vote si cotisation à jour</li>
          </ul>
        </div>
      </div>

      {/* TAB 2: MA CARTE */}
      <div className={`tab-content ${activeTab === 'carte' ? 'active' : ''}`}>
        <div className="section-header">
          <h2>🎫 Ma Carte de Membre</h2>
          <p>Art. 3 du Règlement Intérieur</p>
        </div>

        <div className="member-card-visual">
          <div className="card-top">
            <div className="card-logo">IK</div>
            <div className="card-association-name">I KOUE GUI A ITA<br/><small style={{ fontSize: '9px' }}>Ensemble · Volonté · Engagement</small></div>
          </div>
          <div className="card-middle">
            <div className="card-photo">👤</div>
            <div className="card-member-name">{userData?.nom || userData?.displayName}</div>
            <div className="card-member-category">{userData?.categorie || 'Membre Actif'}</div>
          </div>
          <div className="card-bottom">
            <div className="card-detail-item">
              <div className="label">N° Membre</div>
              <div className="value">{userData?.numeroMembre || `MBR-${userData?.uid?.substring(0,6).toUpperCase()}`}</div>
            </div>
            <div className="card-detail-item">
              <div className="label">Adhésion</div>
              <div className="value">{userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</div>
            </div>
            <div className="card-detail-item">
              <div className="label">Valide jusqu'au</div>
              <div className="value">31/12/{new Date().getFullYear()}</div>
            </div>
            <div className="card-detail-item">
              <div className="label">Statut</div>
              <div className="value" style={{ color: isUpToDate ? '#4CAF50' : '#FF6B6B' }}>
                {isUpToDate ? '✓ À jour' : '⚠️ En retard'}
              </div>
            </div>
          </div>
          <div className="card-qr">
            <div className="qr-placeholder">🔳</div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>QR Code unique - Scan pour vérification</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">ℹ️ Informations</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--texte-secondaire)', lineHeight: '1.6', marginBottom: '12px' }}>
            Cette carte est personnelle et incessible. Elle atteste de votre appartenance à l'Association I KOUE GUI A ITA conformément à l'Article 3 du Règlement Intérieur.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--texte-secondaire)', lineHeight: '1.6' }}>
            <strong>En cas de perte :</strong> Contactez le Secrétaire Général pour obtenir un duplicata.
          </p>
        </div>
      </div>

      {/* TAB 3: COTISATIONS */}
      <div className={`tab-content ${activeTab === 'cotisations' ? 'active' : ''}`}>
        <div className="section-header">
          <h2>💰 Mes Cotisations</h2>
          <p>Historique et paiements</p>
        </div>

        <div className={`cotisation-status ${isUpToDate ? 'a_jour' : 'en_retard'}`}>
          <div className="status-icon">{isUpToDate ? '✅' : '⚠️'}</div>
          <div className="status-text">{isUpToDate ? 'Cotisation à jour' : 'Cotisation en retard'}</div>
          <div className="status-sub">{isUpToDate ? `Prochaine échéance : Janvier ${new Date().getFullYear() + 1}` : 'Veuillez régulariser votre situation'}</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">💳 Payer par Mobile Money</h3>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--texte-secondaire)', marginBottom: '16px' }}>
            Effectuez votre paiement directement depuis votre téléphone :
          </p>
          <div style={{ background: 'var(--fond-alterne)', padding: '14px', borderRadius: '10px', marginBottom: '10px' }}>
            <strong style={{ color: 'var(--bleu-rca)' }}>🟠 Orange Money</strong><br/>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--or-solaire)' }}>+236 75 03 08 57</span><br/>
            <small>Association I KOUE GUI A ITA</small>
          </div>
          <div style={{ background: 'var(--fond-alterne)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
            <strong style={{ color: 'var(--bleu-rca)' }}>🔵 Moov Money</strong><br/>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--or-solaire)' }}>+236 72 06 12 02</span><br/>
            <small>Association I KOUE GUI A ITA</small>
          </div>
          <button className="btn-gold btn-block" onClick={() => alert("Après votre transfert, veuillez contacter le Trésorier Général avec la référence de transaction pour valider votre reçu.")}>
            💰 J'ai effectué le paiement
          </button>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📜 Historique des paiements</h3>
          </div>
          <div>
            {payments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--texte-secondaire)' }}>Aucun paiement enregistré</p>
            ) : (
              payments.map(p => (
                <div key={p.id} className="transaction-item">
                  <div className="transaction-icon">💰</div>
                  <div className="transaction-info">
                    <div className="transaction-title">{p.motif || 'Cotisation'}</div>
                    <div className="transaction-meta">Ref: {p.id.substring(0,8).toUpperCase()}</div>
                  </div>
                  <div className="transaction-amount">
                    <div className="amount">+{Number(p.montant).toLocaleString()} F</div>
                    <div className="date">{formatDate(p.date)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      
      {/* TAB: BENEVOLAT */}
      <div className={`tab-content ${activeTab === 'benevolat' ? 'active' : ''}`}>
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <h2>🤝 Espace Bénévolat</h2>
          <p>Engagez-vous sur les missions de l'association</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {missionsBenevolat.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>Aucune mission pour le moment</h3>
                    <p style={{ margin: 0, color: '#666' }}>Le Bureau n'a pas encore publié de nouvelles missions.</p>
                </div>
            ) : (
                missionsBenevolat.map((mission: any) => {
                    const isRegistered = mission.participants?.includes(userData?.uid);
                    const isFull = mission.requiredVolunteers && mission.participants?.length >= mission.requiredVolunteers;
                    const canRegister = mission.status === 'ouverte' && !isFull && !isRegistered;
                    
                    return (
                        <div key={mission.id} className="card" style={{ padding: '20px', borderRadius: '12px', borderLeft: isRegistered ? '4px solid #128C7E' : '4px solid #f9a826', background: isRegistered ? '#f0fcf5' : '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '18px' }}>{mission.title}</h3>
                                {isRegistered && <span style={{ background: '#128C7E', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Inscrit(e)</span>}
                                {isFull && !isRegistered && mission.status === 'ouverte' && <span style={{ background: '#e0e0e0', color: '#666', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Complet</span>}
                                {mission.status === 'terminee' && <span style={{ background: '#9e9e9e', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Terminée</span>}
                            </div>
                            
                            <p style={{ fontSize: '14px', color: '#4a4a4a', marginBottom: '16px', lineHeight: '1.5' }}>{mission.description}</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '13px', color: '#666' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>📅</span> {formatDate(mission.date)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>📍</span> {mission.location}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: '1 / -1' }}>
                                    <span style={{ fontSize: '16px' }}>👥</span> 
                                    {mission.participants?.length || 0} / {mission.requiredVolunteers || '∞'} bénévole(s)
                                </div>
                            </div>
                            
                            {isRegistered ? (
                                <button 
                                    className="btn btn-outline btn-block" 
                                    style={{ color: '#d32f2f', borderColor: '#d32f2f' }}
                                    onClick={async () => {
                                        if (window.confirm('Voulez-vous annuler votre engagement ?')) {
                                            await updateDoc(doc(db, 'missions_benevolat', mission.id), {
                                                participants: arrayRemove(userData?.uid)
                                            });
                                        }
                                    }}
                                >
                                    Se désister
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-primary btn-block" 
                                    disabled={!canRegister}
                                    style={{ background: !canRegister ? '#ccc' : '#f9a826', color: !canRegister ? '#666' : '#1a1a1a', border: 'none', fontWeight: 'bold' }}
                                    onClick={async () => {
                                        if (canRegister) {
                                            await updateDoc(doc(db, 'missions_benevolat', mission.id), {
                                                participants: arrayUnion(userData?.uid)
                                            });
                                        }
                                    }}
                                >
                                    S'engager pour cette mission
                                </button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>


      {/* TAB 4: DOCUMENTS */}
      <div className={`tab-content ${activeTab === 'documents' ? 'active' : ''}`}>
        <div className="section-header">
          <h2>📄 Documents de l'Assemblée Générale</h2>
          <p>Art. 6 du Règlement Intérieur</p>
        </div>

        <div>
          {documents.map(d => (
            <div key={d.id} className="transaction-item">
              <div className="transaction-icon" style={{ background: 'var(--fond-alterne)' }}>📄</div>
              <div className="transaction-info">
                <div className="transaction-title">{d.title || d.titre}</div>
                <div className="transaction-meta">{d.type || 'Document'} • {formatDate(d.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="alert-box info" style={{ marginTop: '16px' }}>
          <div className="alert-icon">ℹ️</div>
          <div className="alert-content">
            <h4>Accès réservé aux membres</h4>
            <p>Ces documents sont réservés aux membres à jour de cotisation conformément à l'Article 6 du RI.</p>
          </div>
        </div>
      </div>

      {/* TAB 5: DROITS & VOTES */}
      <div className={`tab-content ${activeTab === 'droits' ? 'active' : ''}`}>
        <div className="section-header">
          <h2>⚖️ Mes Droits de Membre</h2>
          <p>Article 4 du Règlement Intérieur</p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">✅ Droits acquis</h3>
          </div>
          <ul className="rights-list">
            <li><strong>Droit de vote</strong> aux Assemblées Générales (si cotisation à jour - Art. 8 RI)</li>
            <li><strong>Droit d'éligibilité</strong> aux postes du Bureau Exécutif</li>
            <li><strong>Droit de proposition</strong> : proposer des actions et projets à l'Association</li>
            <li><strong>Droit d'information</strong> : accéder à toutes les informations de l'Association</li>
            <li><strong>Droit de participation</strong> aux activités et événements</li>
          </ul>
        </div>

        <div className="card">
          <MemberVoting />
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <a onClick={() => { setActiveTab('dashboard'); window.scrollTo(0,0); }} className={activeTab === 'dashboard' ? 'active' : ''}>
          <span className="nav-icon">🏠</span>
          <span>Accueil</span>
        </a>
        <a onClick={() => { setActiveTab('carte'); window.scrollTo(0,0); }} className={activeTab === 'carte' ? 'active' : ''}>
          <span className="nav-icon">🎫</span>
          <span>Carte</span>
        </a>
        <a onClick={() => { setActiveTab('cotisations'); window.scrollTo(0,0); }} className={activeTab === 'cotisations' ? 'active' : ''}>
          <span className="nav-icon">💰</span>
          <span>Cotisations</span>
        </a>
        <a onClick={() => { setActiveTab('benevolat'); window.scrollTo(0,0); }} className={activeTab === 'benevolat' ? 'active' : ''}>
          <span className="nav-icon">🤝</span>
          <span>Bénévolat</span>
        </a>
        <a onClick={() => { setActiveTab('droits'); window.scrollTo(0,0); }} className={activeTab === 'droits' ? 'active' : ''}>
          <span className="nav-icon">🗳️</span>
          <span>Vote</span>
        </a>
      </nav>

      {/* WHATSAPP FAB */}
      <a href="https://wa.me/23675030857?text=Bonjour,%20message%20depuis%20mon%20espace%20membre" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>
    </div>
  );
};
