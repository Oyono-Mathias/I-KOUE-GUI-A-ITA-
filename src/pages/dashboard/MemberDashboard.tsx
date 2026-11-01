import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowRight, CalendarDays, Check, Clipboard, CreditCard, Hash, Wallet } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../styles/membre.css';
import { MemberVoting } from '../member/MemberVoting';

export const MemberDashboard = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const setActiveTab = (tab: string) => setSearchParams({ tab });
  
  const [news, setNews] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [copiedNumber, setCopiedNumber] = useState('');
  const [paymentForm, setPaymentForm] = useState({ montant: '5000', period: String(new Date().getFullYear()), payment: 'orange_money', reference: '' });
  const [documents, setDocuments] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [suppleanceHistory, setSuppleanceHistory] = useState<any[]>([]);
  const [isSuppleanceActive, setIsSuppleanceActive] = useState(false);

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
    
    const unsubPayments = onSnapshot(query(collection(db, 'finances'), where('memberId', '==', userData.uid)), (snap) => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => {
        const da = a.createdAt?.toDate?.() || a.date?.toDate?.() || new Date(a.createdAt || a.date || 0);
        const dbDate = b.createdAt?.toDate?.() || b.date?.toDate?.() || new Date(b.createdAt || b.date || 0);
        return dbDate.getTime() - da.getTime();
      }));
    });

    const unsubForum = onSnapshot(query(collection(db, 'forum'), orderBy('createdAt', 'desc')), (snap) => setForumPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEvents = onSnapshot(query(collection(db, 'ag_events'), orderBy('date', 'desc')), (snap) => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCommissions = onSnapshot(query(collection(db, 'commissions'), orderBy('createdAt', 'desc')), (snap) => setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleance = onSnapshot(query(collection(db, 'suppleance_history'), orderBy('date', 'desc')), (snap) => setSuppleanceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleanceState = onSnapshot(doc(db, 'system', 'suppleance'), (docSnap) => {
      if (docSnap.exists()) setIsSuppleanceActive(docSnap.data().active || false);
    });

    const unsubDocs = onSnapshot(query(collection(db, 'documents'), orderBy('createdAt', 'desc')), (snap) => {
       setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubNews();
      unsubPayments();
      unsubDocs(); unsubForum(); unsubEvents();
    };
  }, [userData?.uid]);

  const validatedPayments = payments.filter((p: any) => p.status === 'valide' || p.status === 'validated' || p.type === 'recette');
  const isUpToDate = userData?.statut === 'a_jour' || validatedPayments.some((p: any) => String(p.period || '').includes(String(new Date().getFullYear())));
  const totalPaid = validatedPayments.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0);

  const submitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.uid || paymentSubmitting) return;
    const amount = Number(paymentForm.montant);
    if (!Number.isFinite(amount) || amount <= 0 || !paymentForm.period.trim() || !paymentForm.reference.trim()) {
      setPaymentMessage('Veuillez renseigner un montant valide, une période et la référence de transaction.');
      return;
    }
    setPaymentSubmitting(true);
    setPaymentMessage('');
    try {
      await addDoc(collection(db, 'finances'), {
        type: 'cotisation_demande', category: 'cotisation', memberId: userData.uid,
        memberName: userData.displayName || userData.email || 'Membre', montant: amount,
        period: paymentForm.period.trim(), payment: paymentForm.payment, reference: paymentForm.reference.trim(),
        status: 'en_attente', createdAt: serverTimestamp()
      });
      setPaymentForm(current => ({ ...current, reference: '' }));
      setPaymentMessage('Votre déclaration a été envoyée. Elle sera vérifiée par le trésorier.');
    } catch (error) {
      console.error('Erreur de déclaration de cotisation:', error);
      setPaymentMessage('Impossible d’envoyer la déclaration. Vérifiez votre connexion et réessayez.');
    } finally { setPaymentSubmitting(false); }
  };
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
        <button className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => { setActiveTab('commissions'); window.scrollTo(0,0); }}>
          <span className="tab-icon">🏛️</span>
          <span>Commissions</span>
        </button>
        <button className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveTab('tasks'); window.scrollTo(0,0); }}>
          <span className="tab-icon">📋</span>
          <span>Tâches</span>
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
        
      {isSuppleanceActive && (
          <div className="alert-box" style={{ background: '#fff3e0', borderColor: '#ff9800', marginBottom: '16px', margin: '0 16px' }}>
              <div className="alert-icon">⚡</div>
              <div className="alert-content">
                  <h4>Mode Suppléance Actif</h4>
                  <p>Le Président est actuellement suppléé par le Vice-Président.</p>
              </div>
          </div>
      )}

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
          <div className="status-icon">{isUpToDate ? <Check size={22} /> : <AlertCircle size={22} />}</div>
          <div className="status-copy">
            <div className="status-text">{isUpToDate ? 'Cotisation à jour' : 'Cotisation en retard'}</div>
            <div className="status-sub">{isUpToDate ? `Prochaine échéance : Janvier ${new Date().getFullYear() + 1}` : 'Votre cotisation annuelle reste à régulariser.'}</div>
          </div>
          {!isUpToDate && <button type="button" className="dues-alert-action" onClick={() => document.getElementById('dues-payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Régulariser <ArrowRight size={16} /></button>}
        </div>

        <div className="card dues-payment-card">
          <div className="card-header">
            <h3 className="card-title">Payer par Mobile Money</h3>
            <span className="dues-secure-label"><Wallet size={14} /> Paiement sécurisé</span>
          </div>
          <p className="dues-intro">Effectuez votre transfert, puis renseignez les informations ci-dessous pour faire vérifier votre paiement.</p>
          <div className="dues-wallet-list">
            {[
              { name: 'Orange Money', number: '+236 75 03 08 57', brand: 'orange' },
              { name: 'Moov Money', number: '+236 72 06 12 02', brand: 'moov' }
            ].map(wallet => (
              <div className="dues-wallet" key={wallet.brand}>
                <div className={`dues-wallet-mark ${wallet.brand}`}>{wallet.brand === 'orange' ? 'O' : 'M'}</div>
                <div className="dues-wallet-details">
                  <strong>{wallet.name}</strong>
                  <span>{wallet.number}</span>
                  <small>Association I KOUE GUI A ITA</small>
                </div>
                <button type="button" className="dues-copy-button" onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(wallet.number.replace(/\\s/g, ''));
                    setCopiedNumber(wallet.brand);
                    window.setTimeout(() => setCopiedNumber(''), 2200);
                  } catch {
                    setPaymentMessage('La copie automatique n’est pas disponible sur cet appareil.');
                  }
                }} aria-label={copiedNumber === wallet.brand ? 'Numéro copié' : `Copier le numéro ${wallet.name}`}>
                  {copiedNumber === wallet.brand ? <Check size={17} /> : <Clipboard size={17} />}
                  <span>{copiedNumber === wallet.brand ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            ))}
          </div>
          <form id="dues-payment-form" onSubmit={submitContribution} className="dues-form">
            <label className="dues-field">
              <span><Wallet size={15} /> Montant à déclarer</span>
              <div className="dues-input-wrap"><input type="number" min="1" required value={paymentForm.montant} onChange={e => setPaymentForm({ ...paymentForm, montant: e.target.value })} /><small>FCFA</small></div>
            </label>
            <label className="dues-field">
              <span><CalendarDays size={15} /> Période concernée</span>
              <select value={paymentForm.period} onChange={e => setPaymentForm({ ...paymentForm, period: e.target.value })}><option value={String(new Date().getFullYear())}>{new Date().getFullYear()}</option><option value={String(new Date().getFullYear()+1)}>{new Date().getFullYear()+1}</option></select>
            </label>
            <label className="dues-field">
              <span><CreditCard size={15} /> Mode de paiement</span>
              <select value={paymentForm.payment} onChange={e => setPaymentForm({ ...paymentForm, payment: e.target.value })}><option value="orange_money">Orange Money</option><option value="moov_money">Moov Money</option><option value="airtel_money">Airtel Money</option><option value="especes">Espèces</option><option value="virement">Virement</option></select>
            </label>
            <label className="dues-field">
              <span><Hash size={15} /> Référence de transaction</span>
              <input type="text" required maxLength={100} value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} placeholder="Ex. : référence reçue après transfert" />
            </label>
            <button type="submit" className="dues-submit-button" disabled={paymentSubmitting}>{paymentSubmitting ? 'Envoi en cours…' : 'Déclarer mon paiement'} <ArrowRight size={17} /></button>
            {paymentMessage && <p role="status" className="dues-form-message">{paymentMessage}</p>}
            <p className="dues-form-note">Votre déclaration reste en attente jusqu’à sa vérification par le trésorier.</p>
          </form>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📜 Historique des paiements</h3>
          </div>
          <div>
            {payments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--texte-secondaire)' }}>Aucun paiement enregistré</p>
            ) : (
              payments.map(p => {
                const paymentStatus = p.status === 'en_attente'
                  ? { label: 'En attente', className: 'pending' }
                  : p.status === 'rejete'
                    ? { label: 'Rejeté', className: 'rejected' }
                    : p.status === 'valide' || p.status === 'validated' || p.type === 'recette'
                      ? { label: 'Validé', className: 'validated' }
                      : { label: 'À vérifier', className: 'unknown' };
                return (
                  <div key={p.id} className="transaction-item dues-history-item">
                    <div className="transaction-icon">💰</div>
                    <div className="transaction-info">
                      <div className="transaction-title">{p.motif || (p.type === 'cotisation_demande' ? 'Déclaration de cotisation' : 'Cotisation')}</div>
                      <div className="transaction-meta">{p.period ? `Période : ${p.period} • ` : ''}Réf. : {p.reference || p.id.substring(0,8).toUpperCase()}</div>
                      {p.status === 'rejete' && <div className="transaction-meta dues-rejection-reason">Motif : {p.rejectionReason || 'non précisé'}</div>}
                      {(p.status === 'valide' || p.status === 'validated') && <button type="button" className="btn btn-outline btn-small" style={{ marginTop: '8px' }} onClick={() => setSelectedReceipt(p)}>Voir / imprimer le reçu</button>}
                    </div>
                    <div className="dues-history-side">
                      <span className={`dues-status-badge ${paymentStatus.className}`}>{paymentStatus.label}</span>
                      <div className="transaction-amount">
                        <div className="amount">+{Number(p.montant).toLocaleString()} F</div>
                        <div className="date">{formatDate(p.validatedAt || p.date || p.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                );
              })
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


      
      {/* TAB COMMISSIONS */}
      <div className={`tab-content ${activeTab === 'commissions' ? 'active' : ''}`}>
        <div className="section-header"><h2>🏛️ Commissions de l'Association</h2></div>
        <div className="card">
            <div className="stats-grid">
                {commissions.map(c => (
                    <div key={c.id} className="stat-card">
                        <div className="stat-label">{c.name}</div>
                        <div className="stat-sublabel">Resp: {c.lead}</div>
                        <div className="stat-value" style={{ fontSize: '14px', marginTop: '8px' }}>{c.status || 'Actif'}</div>
                    </div>
                ))}
            </div>
        </div>
      </div>
      
      {/* TAB TASKS */}
      <div className={`tab-content ${activeTab === 'tasks' ? 'active' : ''}`}>
        <div className="section-header"><h2>📋 Mes Tâches</h2><p>Tâches qui me sont assignées</p></div>
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
        <a onClick={() => { setActiveTab('commissions'); window.scrollTo(0,0); }} className={activeTab === 'commissions' ? 'active' : ''}>
          <span className="nav-icon">🏛️</span>
          <span>Comm.</span>
        </a>
        <a onClick={() => { setActiveTab('tasks'); window.scrollTo(0,0); }} className={activeTab === 'tasks' ? 'active' : ''}>
          <span className="nav-icon">📋</span>
          <span>Tâches</span>
        </a>
        <a onClick={() => { setActiveTab('droits'); window.scrollTo(0,0); }} className={activeTab === 'droits' ? 'active' : ''}>
          <span className="nav-icon">🗳️</span>
          <span>Vote</span>
        </a>
      </nav>

      {selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
          <div style={{ background: '#fff', color: '#222', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '520px' }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #d5ad45', paddingBottom: '14px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0 }}>I KOUE GUI A ITA</h2><p style={{ margin: '6px 0 0' }}>REÇU OFFICIEL DE COTISATION</p>
            </div>
            <p><strong>N° du reçu :</strong> {selectedReceipt.receiptNumber || selectedReceipt.id}</p>
            <p><strong>Membre :</strong> {selectedReceipt.memberName || userData?.displayName || userData?.email}</p>
            <p><strong>Montant :</strong> {Number(selectedReceipt.montant).toLocaleString('fr-FR')} FCFA</p>
            <p><strong>Période :</strong> {selectedReceipt.period || '—'}</p>
            <p><strong>Mode :</strong> {selectedReceipt.payment || '—'}</p>
            <p><strong>Référence :</strong> {selectedReceipt.reference || '—'}</p>
            <p><strong>Date de validation :</strong> {formatDate(selectedReceipt.validatedAt)}</p>
            <p><strong>Validé par (UID) :</strong> {selectedReceipt.validatedByName || selectedReceipt.validatedBy || 'Trésorerie'}</p>
            <p style={{ textAlign: 'center', marginTop: '22px', fontWeight: 700, color: '#18794e' }}>PAIEMENT VALIDÉ</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setSelectedReceipt(null)}>Fermer</button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>Imprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP FAB */}
      <a href="https://wa.me/23675030857?text=Bonjour,%20message%20depuis%20mon%20espace%20membre" className="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">💬</a>
    </div>
  );
};
