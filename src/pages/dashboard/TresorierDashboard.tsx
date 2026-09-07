import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import './TresorierDashboard.css';

export const TresorierDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // Data State
  const [members, setMembers] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>({
    total: 3500000,
    byDomain: {
      education: { allocated: 600000, used: 0 },
      sante: { allocated: 700000, used: 0 },
      agriculture: { allocated: 500000, used: 0 },
      juridique: { allocated: 300000, used: 0 },
      humanitaire: { allocated: 600000, used: 0 },
      jeunesse: { allocated: 400000, used: 0 },
      fonctionnement: { allocated: 250000, used: 0 },
      communication: { allocated: 150000, used: 0 }
    }
  });

  // Filters
  const [incomeFilter, setIncomeFilter] = useState('all');
  const [incomeSearch, setIncomeSearch] = useState('');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [duesFilter, setDuesFilter] = useState('all');
  const [duesSearch, setDuesSearch] = useState('');

  // Modals
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [duesModalOpen, setDuesModalOpen] = useState<{ isOpen: boolean, memberId: string, memberName: string, amount: number }>({ isOpen: false, memberId: '', memberName: '', amount: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, message: '', onConfirm: () => {} });

  // Form State Handlers
  const [incomeType, setIncomeType] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');

  // Real-time Listeners
  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubIncome = onSnapshot(query(collection(db, 'income'), orderBy('date', 'desc')), (snap) => setIncome(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubBoardMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubFactures = onSnapshot(query(collection(db, 'factures'), orderBy('date', 'desc')), (snap) => setFactures(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubExpenses = onSnapshot(query(collection(db, 'expenses'), orderBy('date', 'desc')), (snap) => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    // Dues can be derived from members or custom collection, here we derive for simplicity
    
    return () => { unsubMembers(); unsubIncome(); unsubExpenses(); unsubBoardMessages(); unsubFactures(); };
  }, []);

  // Update Dues List based on members
  useEffect(() => {
      const derivedDues = members.map(m => ({
          memberId: m.id,
          memberName: m.nom,
          category: m.categorie,
          status: m.statut,
          amount: m.cotisationAnnuelle || 5000,
          lastPayment: m.dernierPaiement,
          exonere: m.exonere || false
      }));
      setDues(derivedDues);
  }, [members]);

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '-'; }
  };

  const isCurrentMonth = (date: any) => {
    if (!date) return false;
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
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
  const totalIncome = income.reduce((sum, i) => sum + (Number(i.montant) || 0), 0);
  const totalExpense = expenses.filter(e => e.status === 'signed').reduce((sum, e) => sum + (Number(e.montant) || 0), 0);
  const pendingExpense = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (Number(e.montant) || 0), 0);
  const balance = totalIncome - totalExpense;
  const unpaidMembersCount = members.filter(m => m.statut === 'en_retard').length;
  const totalNotifs = unpaidMembersCount + expenses.filter(e => e.status === 'pending').length;

  const currentMonthIncome = income.filter(i => isCurrentMonth(i.date)).reduce((sum, i) => sum + (Number(i.montant) || 0), 0);
  const currentMonthExpense = expenses.filter(e => e.status === 'signed' && isCurrentMonth(e.date)).reduce((sum, e) => sum + (Number(e.montant) || 0), 0);

  // Save Income
  const saveIncome = async (e: React.FormEvent) => {
      e.preventDefault();
      const memName = (document.getElementById('incomeMember') as HTMLSelectElement).value;
      const amount = parseInt(incomeAmount);
      const data = {
          type: incomeType,
          category: incomeType,
          montant: amount,
          date: new Date((document.getElementById('incomeDate') as HTMLInputElement).value),
          membre: memName,
          payment: (document.getElementById('incomePayment') as HTMLSelectElement).value,
          reference: (document.getElementById('incomeReference') as HTMLInputElement).value,
          description: (document.getElementById('incomeDescription') as HTMLTextAreaElement).value,
          titre: `${incomeType === 'cotisation' ? 'Cotisation' : incomeType === 'don' ? 'Don' : 'Recette'} - ${memName}`,
          recordedBy: 'treasurer',
          recordedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'income'), data);
      setIncomeModalOpen(false);
      setIncomeType('');
      setIncomeAmount('');
  };

  // Save Expense
  const saveExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
          titre: (document.getElementById('expenseTitle') as HTMLInputElement).value,
          montant: parseInt((document.getElementById('expenseAmount') as HTMLInputElement).value),
          date: new Date((document.getElementById('expenseDate') as HTMLInputElement).value),
          category: (document.getElementById('expenseCategory') as HTMLSelectElement).value,
          beneficiary: (document.getElementById('expenseBeneficiary') as HTMLInputElement).value,
          description: (document.getElementById('expenseDescription') as HTMLTextAreaElement).value,
          status: 'pending',
          submittedBy: 'treasurer',
          submittedAt: serverTimestamp()
      };
      await addDoc(collection(db, 'expenses'), data);
      setExpenseModalOpen(false);
  };

  // Save Dues Payment
  const saveDuesPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      const data = {
          memberId: duesModalOpen.memberId,
          memberName: duesModalOpen.memberName,
          montant: parseInt((document.getElementById('duesAmount') as HTMLInputElement).value),
          period: (document.getElementById('duesPeriod') as HTMLSelectElement).value,
          payment: (document.getElementById('duesPayment') as HTMLSelectElement).value,
          reference: (document.getElementById('duesReference') as HTMLInputElement).value,
          date: new Date(),
          recordedBy: 'treasurer',
          recordedAt: serverTimestamp()
      };

      // Add income record
      await addDoc(collection(db, 'income'), {
          ...data,
          type: 'cotisation',
          category: 'cotisation',
          titre: `Cotisation ${duesModalOpen.memberName} ${data.period}`
      });

      // Update member status
      await updateDoc(doc(db, 'members', duesModalOpen.memberId), {
          statut: 'a_jour',
          dernierPaiement: serverTimestamp()
      });

      setDuesModalOpen({ isOpen: false, memberId: '', memberName: '', amount: 0 });
      alert('✅ Cotisation enregistrée et statut du membre mis à jour !');
  };

  // Charts data calculation
  const getIncomeChartBars = () => {
    const byCategory: any = {};
    income.filter(i => isCurrentMonth(i.date)).forEach(i => {
        byCategory[i.category] = (byCategory[i.category] || 0) + (Number(i.montant) || 0);
    });
    const max = Math.max(0, ...Object.values(byCategory) as number[]);
    const colors: any = { cotisation: 'var(--vert-espoir)', don: 'var(--or-solaire)', subvention: 'var(--bleu-ciel)', partenariat: 'var(--violet-dignite)', adhesion: 'var(--orange-energie)', autre: 'var(--texte-secondaire)' };
    const labels: any = { cotisation: 'Cotisations', don: 'Dons', subvention: 'Subventions', partenariat: 'Partenariats', adhesion: 'Adhésions', autre: 'Autre' };

    return Object.keys(byCategory).map(cat => ({
        cat,
        value: byCategory[cat],
        height: max > 0 ? `${(byCategory[cat] / max) * 100}%` : '0%',
        color: colors[cat] || 'var(--bleu-rca)',
        label: labels[cat] || cat
    }));
  };

  const getExpenseChartBars = () => {
      const byCategory: any = {};
      expenses.filter(e => e.status === 'signed' && isCurrentMonth(e.date)).forEach(e => {
          byCategory[e.category] = (byCategory[e.category] || 0) + (Number(e.montant) || 0);
      });
      const max = Math.max(0, ...Object.values(byCategory) as number[]);
      const colors: any = { education: 'var(--orange-energie)', sante: 'var(--rouge-solidarite)', agriculture: 'var(--vert-espoir)', juridique: 'var(--violet-dignite)', humanitaire: 'var(--rouge-solidarite)', jeunesse: 'var(--violet-dignite)', fonctionnement: 'var(--texte-secondaire)', communication: 'var(--bleu-ciel)' };
      const labels: any = { education: 'Éducation', sante: 'Santé', agriculture: 'Agriculture', juridique: 'Juridique', humanitaire: 'Humanitaire', jeunesse: 'Jeunesse', fonctionnement: 'Fonct.', communication: 'Com.' };

      return Object.keys(byCategory).map(cat => ({
          cat,
          value: byCategory[cat],
          height: max > 0 ? `${(byCategory[cat] / max) * 100}%` : '0%',
          color: colors[cat] || 'var(--bleu-rca)',
          label: labels[cat] || cat
      }));
  };

  // Recent transactions list
  const recentTransactions = [
      ...income.map(i => ({ ...i, isIncome: true })),
      ...expenses.map(e => ({ ...e, isIncome: false }))
  ].sort((a, b) => {
      const timeA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
      const timeB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
      return timeB - timeA;
  }).slice(0, 5);

  return (
    <div className="tres-dashboard-container">
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
                              {unpaidMembersCount > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#B45309', cursor: 'pointer' }} onClick={() => { setActiveTab('dues'); setShowNotifPanel(false); }}>⚠️ {unpaidMembersCount} membre(s) en retard</div>}
                              {expenses.filter(e => e.status === 'pending').length > 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#C62828', cursor: 'pointer' }} onClick={() => { setActiveTab('expenses'); setShowNotifPanel(false); }}>💸 {expenses.filter(e => e.status === 'pending').length} dépense(s) en attente</div>}
                              {totalNotifs === 0 && <div style={{ padding: '8px 0', fontSize: '13px', color: '#666' }}>Aucune notification.</div>}
                          </div>
                      )}
                  </div>
                  <button className="header-btn" onClick={handleLogout}>🚪</button>
              </div>
          </div>
          <div className="member-info-bar">
              <div className="member-avatar">💰</div>
              <div className="member-details">
                  <div className="member-name">Trésorier Général</div>
                  <div className="member-role">💰 Trésorier Général du Bureau</div>
              </div>
              <div className="member-badge">Bureau</div>
          </div>
      </header>

      {/* TAB NAV */}
      <nav className="tab-nav" style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '8px' }}>
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><span className="tab-icon">📊</span><span>Dashboard</span></button>
          <button className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}><span className="tab-icon">💵</span><span>Recettes</span></button>
          <button className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}><span className="tab-icon">💸</span><span>Dépenses</span></button>
          <button className={`tab-btn ${activeTab === 'dues' ? 'active' : ''}`} onClick={() => setActiveTab('dues')}><span className="tab-icon">👥</span><span>Cotisations</span></button>
          <button className={`tab-btn ${activeTab === 'factures' ? 'active' : ''}`} onClick={() => setActiveTab('factures')}><span className="tab-icon">🧾</span><span>Factures</span></button>
          <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}><span className="tab-icon">💬</span><span>Messages</span></button>
          <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}><span className="tab-icon">📊</span><span>Rapports</span></button>
          <button className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}><span className="tab-icon">📋</span><span>Budget</span></button>
      </nav>

      {/* TAB: DASHBOARD */}
      <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <div className="welcome-card">
              <span className="role-badge">💰 Trésorier Général</span>
              <h2>Bienvenue, Mr le Trésorier </h2>
              <p>Vous gérez les finances de l'Association avec transparence et rigueur (Art. 16 Statuts).</p>
          </div>

          <div className="finance-summary">
              <div className="finance-card income">
                  <div className="fin-icon">💰</div>
                  <div className="fin-label">Recettes totales</div>
                  <div className="fin-amount">{totalIncome.toLocaleString()} F</div>
                  <div className="fin-sublabel">{income.length} transactions</div>
              </div>
              <div className="finance-card expense">
                  <div className="fin-icon">💸</div>
                  <div className="fin-label">Dépenses totales</div>
                  <div className="fin-amount">{totalExpense.toLocaleString()} F</div>
                  <div className="fin-sublabel">{expenses.filter(e => e.status === 'signed').length} validées</div>
              </div>
              <div className="finance-card balance">
                  <div className="fin-icon">📊</div>
                  <div className="fin-label">Solde actuel</div>
                  <div className="fin-amount">{balance.toLocaleString()} F</div>
                  <div className="fin-sublabel">{balance >= 0 ? 'Positif ✓' : 'Négatif ⚠️'}</div>
              </div>
              <div className="finance-card pending">
                  <div className="fin-icon">⏳</div>
                  <div className="fin-label">En attente</div>
                  <div className="fin-amount">{pendingExpense.toLocaleString()} F</div>
                  <div className="fin-sublabel">{expenses.filter(e => e.status === 'pending').length} dépenses</div>
              </div>
          </div>

          {unpaidMembersCount > 0 && <div className="alert-box warning"><div className="alert-icon">⚠️</div><div className="alert-content"><h4>{unpaidMembersCount} membre(s) en retard de cotisation</h4><p>Envoyez des relances pour régulariser la situation.</p></div><button className="btn btn-outline btn-small" onClick={() => setActiveTab('dues')}>Voir →</button></div>}
          {pendingExpense > 0 && <div className="alert-box danger"><div className="alert-icon">💸</div><div className="alert-content"><h4>{expenses.filter(e => e.status === 'pending').length} dépense(s) en attente</h4><p>En attente de cosignature du Président.</p></div><button className="btn btn-outline btn-small" onClick={() => setActiveTab('expenses')}>Voir →</button></div>}
          {balance < 100000 && balance >= 0 && <div className="alert-box info"><div className="alert-icon">📊</div><div className="alert-content"><h4>Solde faible: {balance.toLocaleString()} FCFA</h4><p>Envisagez une collecte de fonds.</p></div></div>}

          <div className="card">
              <div className="card-header"><h3 className="card-title">⚡ Actions rapides</h3></div>
              <div className="quick-actions">
                  <div className="quick-action" onClick={() => setIncomeModalOpen(true)}><div className="qa-icon">💵</div><div className="qa-title">Enregistrer recette</div></div>
                  <div className="quick-action" onClick={() => setExpenseModalOpen(true)}><div className="qa-icon">💸</div><div className="qa-title">Nouvelle dépense</div></div>
                  <div className="quick-action" onClick={() => setActiveTab('dues')}><div className="qa-icon">👥</div><div className="qa-title">Cotisations</div></div>
                  <div className="quick-action" onClick={() => setActiveTab('reports')}><div className="qa-icon">📊</div><div className="qa-title">Rapport financier</div></div>
                  <div className="quick-action" onClick={() => setActiveTab('budget')}><div className="qa-icon">📋</div><div className="qa-title">Budget</div></div>
                  <div className="quick-action" onClick={() => alert('Export non implémenté')}><div className="qa-icon">⬇️</div><div className="qa-title">Exporter</div></div>
              </div>
          </div>

          <div className="card">
              <div className="card-header">
                  <h3 className="card-title">🕐 Transactions récentes</h3>
                  <button className="btn btn-outline btn-small" onClick={() => setActiveTab('income')}>Voir tout →</button>
              </div>
              <div>
                  {recentTransactions.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--texte-secondaire)' }}>Aucune transaction récente</p> : 
                      recentTransactions.map((t: any, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--bordure)' }}>
                              <div style={{ fontSize: '24px' }}>{t.isIncome ? '💵' : '💸'}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bleu-rca)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titre}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--texte-secondaire)' }}>{formatDate(t.date)}</div>
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: t.isIncome ? 'var(--vert-espoir)' : 'var(--rouge-solidarite)' }}>
                                  {t.isIncome ? '+' : '-'}{Number(t.montant).toLocaleString()} F
                              </div>
                          </div>
                      ))
                  }
              </div>
          </div>
      </div>

      {/* TAB: INCOME */}
      <div className={`tab-content ${activeTab === 'income' ? 'active' : ''}`}>
          <div className="section-header"><h2>💵 Gestion des Recettes</h2></div>
          <button className="btn btn-gold btn-block" onClick={() => setIncomeModalOpen(true)} style={{ marginBottom: '16px' }}>➕ Enregistrer une recette</button>
          
          <div className="finance-summary">
              <div className="finance-card income"><div className="fin-label">Ce mois</div><div className="fin-amount">{currentMonthIncome.toLocaleString()} F</div></div>
              <div className="finance-card balance"><div className="fin-label">Cotisations</div><div className="fin-amount">{income.filter(i => i.category === 'cotisation').reduce((s,i) => s + (Number(i.montant) || 0), 0).toLocaleString()} F</div></div>
              <div className="finance-card pending"><div className="fin-label">Dons & Partenariats</div><div className="fin-amount">{income.filter(i => ['don', 'partenariat', 'subvention'].includes(i.category)).reduce((s,i) => s + (Number(i.montant) || 0), 0).toLocaleString()} F</div></div>
          </div>

          <div className="sub-tabs">
              {['all', 'cotisation', 'don', 'subvention', 'partenariat', 'adhesion'].map(f => (
                  <button key={f} className={`sub-tab ${incomeFilter === f ? 'active' : ''}`} onClick={() => setIncomeFilter(f)}>
                      {f === 'all' ? 'Toutes' : f === 'cotisation' ? '💵 Cotisations' : f === 'don' ? '💛 Dons' : f === 'subvention' ? '🏛️ Subventions' : f === 'partenariat' ? '🤝 Partenariats' : '📝 Adhésions'}
                  </button>
              ))}
          </div>

          <div className="filters-bar"><input type="text" className="search-input" placeholder="Rechercher..." value={incomeSearch} onChange={(e) => setIncomeSearch(e.target.value)} /></div>
          
          <div className="chart-container">
              <h4 style={{ fontSize: '14px', color: 'var(--bleu-rca)', marginBottom: '12px' }}>📊 Recettes par catégorie (ce mois)</h4>
              <div className="chart-bar-container">
                  {getIncomeChartBars().length === 0 ? <p style={{ textAlign: 'center', width: '100%', color: 'var(--texte-secondaire)', fontSize: '13px' }}>Aucune donnée ce mois</p> :
                      getIncomeChartBars().map((b, i) => (
                          <div key={i} className="chart-bar" style={{ height: b.height, background: b.color }} title={b.label}>
                              <div className="bar-value">{(b.value / 1000).toFixed(0)}k</div>
                              <div className="bar-label">{b.label.substring(0,4)}</div>
                          </div>
                      ))
                  }
              </div>
          </div>

          <div>
              {income.filter(i => (incomeFilter === 'all' || i.category === incomeFilter) && i.titre.toLowerCase().includes(incomeSearch.toLowerCase())).map(i => {
                  const typeIcons: any = { cotisation: '💵', don: '💛', subvention: '🏛️', partenariat: '🤝', adhesion: '📝', autre: '📄' };
                  return (
                      <div key={i.id} className="transaction-item">
                          <div className="transaction-icon income">{typeIcons[i.category] || '💵'}</div>
                          <div className="transaction-info">
                              <div className="transaction-title">{i.titre}</div>
                              <div className="transaction-meta">{i.membre || '-'} • {i.payment}</div>
                              {i.reference && <div className="transaction-meta" style={{ marginTop: '2px' }}>Ref: {i.reference}</div>}
                          </div>
                          <div className="transaction-amount">
                              <div className="amount income">+{Number(i.montant).toLocaleString()} F</div>
                              <div className="date">{formatDate(i.date)}</div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* TAB: EXPENSES */}
      <div className={`tab-content ${activeTab === 'expenses' ? 'active' : ''}`}>
          <div className="section-header"><h2>💸 Gestion des Dépenses</h2><p>Art. 16 Statuts - Cosignature requise</p></div>
          <button className="btn btn-gold btn-block" onClick={() => setExpenseModalOpen(true)} style={{ marginBottom: '16px' }}>➕ Enregistrer une dépense</button>
          
          <div className="finance-summary">
              <div className="finance-card expense"><div className="fin-label">Ce mois</div><div className="fin-amount">{currentMonthExpense.toLocaleString()} F</div></div>
              <div className="finance-card pending"><div className="fin-label">En attente</div><div className="fin-amount">{pendingExpense.toLocaleString()} F</div></div>
              <div className="finance-card balance"><div className="fin-label">Total Validées</div><div className="fin-amount">{totalExpense.toLocaleString()} F</div></div>
          </div>

          <div className="sub-tabs">
              <button className={`sub-tab ${expenseFilter === 'all' ? 'active' : ''}`} onClick={() => setExpenseFilter('all')}>Toutes</button>
              <button className={`sub-tab ${expenseFilter === 'pending' ? 'active' : ''}`} onClick={() => setExpenseFilter('pending')}>⏳ En attente</button>
              <button className={`sub-tab ${expenseFilter === 'signed' ? 'active' : ''}`} onClick={() => setExpenseFilter('signed')}>✅ Signées</button>
              <button className={`sub-tab ${expenseFilter === 'rejected' ? 'active' : ''}`} onClick={() => setExpenseFilter('rejected')}>❌ Refusées</button>
          </div>

          <div className="filters-bar">
              <div className="form-row">
                  <input type="text" className="search-input" placeholder="Rechercher..." value={expenseSearch} onChange={(e) => setExpenseSearch(e.target.value)} />
                  <select className="filter-select" value={expenseCategoryFilter} onChange={(e) => setExpenseCategoryFilter(e.target.value)}>
                      <option value="">Toutes catégories</option>
                      <option value="education"> Éducation</option>
                      <option value="sante">🏥 Santé</option>
                      <option value="agriculture">🌱 Agriculture</option>
                      <option value="juridique">⚖️ Juridique</option>
                      <option value="humanitaire">🤝 Humanitaire</option>
                      <option value="jeunesse">🎯 Jeunesse</option>
                      <option value="fonctionnement">⚙️ Fonctionnement</option>
                      <option value="communication">📢 Communication</option>
                  </select>
              </div>
          </div>

          <div className="chart-container">
              <h4 style={{ fontSize: '14px', color: 'var(--bleu-rca)', marginBottom: '12px' }}>📊 Dépenses par domaine (ce mois)</h4>
              <div className="chart-bar-container">
                  {getExpenseChartBars().length === 0 ? <p style={{ textAlign: 'center', width: '100%', color: 'var(--texte-secondaire)', fontSize: '13px' }}>Aucune donnée ce mois</p> :
                      getExpenseChartBars().map((b, i) => (
                          <div key={i} className="chart-bar" style={{ height: b.height, background: b.color }} title={b.label}>
                              <div className="bar-value">{(b.value / 1000).toFixed(0)}k</div>
                              <div className="bar-label">{b.label.substring(0,4)}</div>
                          </div>
                      ))
                  }
              </div>
          </div>

          <div>
              {expenses.filter(e => (expenseFilter === 'all' || e.status === expenseFilter) && (expenseCategoryFilter === '' || e.category === expenseCategoryFilter) && e.titre.toLowerCase().includes(expenseSearch.toLowerCase())).map(e => {
                  const categoryIcons: any = { education: '📚', sante: '🏥', agriculture: '🌱', juridique: '⚖️', humanitaire: '🤝', jeunesse: '🎯', fonctionnement: '⚙️', communication: '📢' };
                  return (
                      <div key={e.id} className="transaction-item">
                          <div className={`transaction-icon ${e.status === 'pending' ? 'pending' : 'expense'}`}>{categoryIcons[e.category] || '💸'}</div>
                          <div className="transaction-info">
                              <div className="transaction-title">{e.titre}</div>
                              <div className="transaction-meta">{e.beneficiary || '-'} • {e.category}</div>
                              <div style={{ marginTop: '4px' }}>
                                  {e.status === 'pending' && <span className="badge badge-warning">⏳ En attente</span>}
                                  {e.status === 'signed' && <span className="badge badge-success">✅ Signée</span>}
                                  {e.status === 'rejected' && <span className="badge badge-danger">❌ Refusée</span>}
                              </div>
                          </div>
                          <div className="transaction-amount">
                              <div className={`amount ${e.status === 'pending' ? 'pending' : 'expense'}`}>-{Number(e.montant).toLocaleString()} F</div>
                              <div className="date">{formatDate(e.date)}</div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* TAB: DUES */}
      <div className={`tab-content ${activeTab === 'dues' ? 'active' : ''}`}>
          <div className="section-header"><h2>👥 Suivi des Cotisations</h2></div>
          
          <div className="stats-grid">
              <div className="stat-card success"><div className="stat-icon">✅</div><div className="stat-value">{dues.filter(d => d.status === 'a_jour' || d.exonere).length}</div><div className="stat-label">À jour</div></div>
              <div className="stat-card alert"><div className="stat-icon">⚠️</div><div className="stat-value">{dues.filter(d => d.status === 'en_retard' && !d.exonere).length}</div><div className="stat-label">En retard</div></div>
          </div>
          
          <div className="card">
              <h4 style={{ fontSize: '14px', color: 'var(--bleu-rca)', marginBottom: '12px' }}>📊 Taux de recouvrement</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--texte-secondaire)' }}>Objectif annuel</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bleu-rca)' }}>{dues.length > 0 ? Math.round((dues.filter(d => d.status === 'a_jour' || d.exonere).length / dues.length) * 100) : 0}%</span>
              </div>
              <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${dues.length > 0 ? Math.round((dues.filter(d => d.status === 'a_jour' || d.exonere).length / dues.length) * 100) : 0}%` }}></div>
              </div>
          </div>

          <div className="sub-tabs">
              <button className={`sub-tab ${duesFilter === 'all' ? 'active' : ''}`} onClick={() => setDuesFilter('all')}>Tous</button>
              <button className={`sub-tab ${duesFilter === 'a_jour' ? 'active' : ''}`} onClick={() => setDuesFilter('a_jour')}>✅ À jour</button>
              <button className={`sub-tab ${duesFilter === 'en_retard' ? 'active' : ''}`} onClick={() => setDuesFilter('en_retard')}>⚠️ En retard</button>
              <button className={`sub-tab ${duesFilter === 'exonere' ? 'active' : ''}`} onClick={() => setDuesFilter('exonere')}>⭐ Exonérés</button>
          </div>

          <div className="filters-bar"><input type="text" className="search-input" placeholder="Rechercher..." value={duesSearch} onChange={(e) => setDuesSearch(e.target.value)} /></div>

          <div>
              {dues.filter(d => (duesFilter === 'all' || d.status === duesFilter || (duesFilter === 'exonere' && d.exonere)) && d.memberName.toLowerCase().includes(duesSearch.toLowerCase())).map(d => {
                  const isPaid = d.status === 'a_jour' || d.exonere;
                  return (
                      <div key={d.memberId} className="dues-item">
                          <div className="dues-avatar">{d.memberName.substring(0,2).toUpperCase()}</div>
                          <div className="dues-info">
                              <div className="dues-name">{d.memberName} {d.exonere ? '⭐' : ''}</div>
                              <div className="dues-meta">{d.category} • Dernier: {formatDate(d.lastPayment)}</div>
                          </div>
                          <div className="dues-status">
                              <div className={`dues-amount ${isPaid ? 'paid' : 'unpaid'}`}>{isPaid ? '✓' : `${Number(d.amount).toLocaleString()} F`}</div>
                              {!isPaid && <button className="btn btn-gold btn-small" onClick={() => setDuesModalOpen({ isOpen: true, memberId: d.memberId, memberName: d.memberName, amount: d.amount })} style={{ marginTop: '4px' }}>💵 Payer</button>}
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* TAB: REPORTS */}
      <div className={`tab-content ${activeTab === 'reports' ? 'active' : ''}`}>
          <div className="section-header"><h2>📊 Rapports Financiers</h2></div>
          <div className="stats-grid">
              <div className="stat-card success"><div className="stat-icon">💰</div><div className="stat-value">{totalIncome.toLocaleString()}</div><div className="stat-label">Recettes totales</div></div>
              <div className="stat-card alert"><div className="stat-icon">💸</div><div className="stat-value">{totalExpense.toLocaleString()}</div><div className="stat-label">Dépenses totales</div></div>
              <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value">{balance.toLocaleString()}</div><div className="stat-label">Solde</div></div>
              <div className="stat-card"><div className="stat-icon">📈</div><div className="stat-value">{totalIncome > 0 ? Math.round((balance/totalIncome)*100) : 0}%</div><div className="stat-label">Marge</div></div>
          </div>
          <div className="card">
              <div className="card-header"><h3 className="card-title">📄 Rapports disponibles</h3></div>
              <div className="report-card"><div className="report-icon">📊</div><div className="report-info"><div className="report-title">Rapport financier T3 2026</div><div className="report-meta">PDF • 1.2 MB</div></div><button className="btn btn-primary btn-small">⬇</button></div>
              <div className="report-card"><div className="report-icon">📈</div><div className="report-info"><div className="report-title">Rapport financier T2 2026</div><div className="report-meta">PDF • 1.1 MB</div></div><button className="btn btn-primary btn-small">⬇</button></div>
          </div>
          <div className="card">
              <div className="card-header"><h3 className="card-title">🛠️ Générer un rapport</h3></div>
              <div className="quick-actions">
                  <div className="quick-action" onClick={() => alert('Génération rapport mensuel')}><div className="qa-icon">📄</div><div className="qa-title">Rapport mensuel</div></div>
                  <div className="quick-action" onClick={() => alert('Génération rapport trimestriel')}><div className="qa-icon">📊</div><div className="qa-title">Rapport trimestriel</div></div>
                  <div className="quick-action" onClick={() => alert('Génération rapport annuel')}><div className="qa-icon">📚</div><div className="qa-title">Rapport annuel</div></div>
              </div>
          </div>
      </div>

      {/* TAB: BUDGET */}
      <div className={`tab-content ${activeTab === 'budget' ? 'active' : ''}`}>
          <div className="section-header"><h2>📋 Budget Prévisionnel</h2></div>
          <div className="finance-summary">
              <div className="finance-card balance"><div className="fin-icon">📋</div><div className="fin-label">Budget total 2026</div><div className="fin-amount">{budget.total.toLocaleString()} F</div></div>
              <div className="finance-card income"><div className="fin-label">Utilisé</div><div className="fin-amount">{Object.values(budget.byDomain).reduce((s:any, d:any) => s + d.used, 0).toLocaleString()} F</div></div>
          </div>
          <div className="card">
              <div className="card-header"><h3 className="card-title">📊 Budget par domaine</h3></div>
              {Object.entries(budget.byDomain).map(([key, data]: [string, any]) => {
                  const percent = Math.round((data.used / data.allocated) * 100);
                  const domainLabels: any = { education: '📚 Éducation', sante: '🏥 Santé', agriculture: '🌱 Agriculture', juridique: '⚖️ Juridique', humanitaire: '🤝 Humanitaire', jeunesse: '🎯 Jeunesse', fonctionnement: '⚙️ Fonctionnement', communication: '📢 Communication' };
                  const domainColors: any = { education: 'var(--orange-energie)', sante: 'var(--rouge-solidarite)', agriculture: 'var(--vert-espoir)', juridique: 'var(--violet-dignite)', humanitaire: 'var(--rouge-solidarite)', jeunesse: 'var(--violet-dignite)', fonctionnement: 'var(--texte-secondaire)', communication: 'var(--bleu-ciel)' };
                  return (
                      <div key={key} style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bleu-rca)' }}>{domainLabels[key] || key}</span>
                              <span style={{ fontSize: '13px', color: 'var(--texte-secondaire)' }}>{data.used.toLocaleString()} / {data.allocated.toLocaleString()} F ({percent}%)</span>
                          </div>
                          <div className="progress-bar">
                              <div className="progress-bar-fill" style={{ width: `${Math.min(percent, 100)}%`, background: domainColors[key] || 'var(--or-solaire)' }}></div>
                          </div>
                      </div>
                  );
              })}
          </div>
      </div>

      {/* TAB FACTURES */}
      <div className={`tab-content ${activeTab === 'factures' ? 'active' : ''}`}>
        <div className="section-header"><h2>🧾 Gestion des Factures</h2><p>Suivi des factures fournisseurs et justificatifs</p></div>
        <div className="card">
            {factures.map(f => (
                <div key={f.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{f.fournisseur}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>Montant: {Number(f.montant).toLocaleString()} F • Échéance: {new Date(f.date?.seconds * 1000).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span className={`badge ${f.status === 'payee' ? 'badge-success' : 'badge-warning'}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{f.status === 'payee' ? 'Payée' : 'En attente'}</span>
                        <button className="btn btn-outline btn-small" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={async () => {
                            await updateDoc(doc(db, 'factures', f.id), { status: f.status === 'payee' ? 'en_attente' : 'payee' });
                        }}>
                            {f.status === 'payee' ? 'Annuler' : 'Marquer payée'}
                        </button>
                    </div>
                </div>
            ))}
            {factures.length === 0 && <div className="empty-state">Aucune facture enregistrée.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const obj = (document.getElementById('fFour') as HTMLInputElement).value;
                const montant = (document.getElementById('fMont') as HTMLInputElement).value;
                if(obj && montant) {
                    await addDoc(collection(db, 'factures'), { fournisseur: obj, montant: Number(montant), status: 'en_attente', date: serverTimestamp() });
                    (e.target as HTMLFormElement).reset();
                }
            }} style={{ marginTop: '20px' }}>
                <h3 className="card-title">Enregistrer une facture</h3>
                <div className="form-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input type="text" id="fFour" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Fournisseur / Motif" required />
                    <input type="number" id="fMont" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Montant" required />
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Ajouter</button>
                </div>
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
                    const isMe = m.role === 'tresorier';
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
                    id="tresChatMsg" 
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
                            const input = document.getElementById('tresChatMsg') as HTMLTextAreaElement;
                            if(input.value.trim()) {
                                await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Trésorier Général', role: 'tresorier', timestamp: serverTimestamp() });
                                input.value = '';
                                input.style.height = 'auto';
                            }
                        }
                    }}
                />
                <button 
                    onClick={async () => {
                        const input = document.getElementById('tresChatMsg') as HTMLTextAreaElement;
                        if(input.value.trim()) {
                            await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: 'Trésorier Général', role: 'tresorier', timestamp: serverTimestamp() });
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
          <button style={{ minWidth: '80px', flex: '0 0 auto' }} className={activeTab === 'income' ? 'active' : ''} onClick={() => setActiveTab('income')}><span className="nav-icon">💵</span><span>Recettes</span></button>
          <button style={{ minWidth: '80px', flex: '0 0 auto' }} className={activeTab === 'expenses' ? 'active' : ''} onClick={() => setActiveTab('expenses')}><span className="nav-icon">💸</span><span>Dépenses</span></button>
          <button className={activeTab === 'dues' ? 'active' : ''} onClick={() => setActiveTab('dues')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">👥</span><span>Cotisations</span></button>
          <button className={activeTab === 'factures' ? 'active' : ''} onClick={() => setActiveTab('factures')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">🧾</span><span>Factures</span></button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💬</span><span>Messages</span></button>
      </nav>

      {/* MODALS */}
      {incomeModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Enregistrer une Recette</h3>
                  <form onSubmit={saveIncome}>
                      <div className="form-group">
                          <label>Type de recette</label>
                          <select id="incomeType" value={incomeType} onChange={(e) => {
                              setIncomeType(e.target.value);
                              if (e.target.value === 'cotisation') setIncomeAmount('5000');
                              if (e.target.value === 'adhesion') setIncomeAmount('2000');
                          }} required>
                              <option value="">-- Choisir --</option>
                              <option value="cotisation">Cotisation membre</option>
                              <option value="adhesion">Frais d'adhésion</option>
                              <option value="don">Don</option>
                              <option value="subvention">Subvention</option>
                              <option value="partenariat">Partenariat</option>
                          </select>
                      </div>
                      <div className="form-row">
                          <div className="form-group"><label>Montant (FCFA)</label><input type="number" id="incomeAmount" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} required min="0" /></div>
                          <div className="form-group"><label>Date</label><input type="date" id="incomeDate" required /></div>
                      </div>
                      <div className="form-group">
                          <label>Membre / Donateur</label>
                          <select id="incomeMember" required>
                              <option value="">-- Choisir --</option>
                              {members.map(m => <option key={m.id} value={m.nom}>{m.nom} ({m.categorie})</option>)}
                              <option value="Externe">Donateur externe</option>
                          </select>
                      </div>
                      <div className="form-group"><label>Mode de paiement</label><select id="incomePayment" required><option value="orange_money">Orange Money</option><option value="moov_money">Moov Money</option><option value="airtel_money">Airtel Money</option><option value="especes">Espèces</option><option value="virement">Virement</option></select></div>
                      <div className="form-group"><label>Référence / N° transaction</label><input type="text" id="incomeReference" /></div>
                      <div className="form-group"><label>Description</label><textarea id="incomeDescription" rows={2}></textarea></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn btn-gold">Enregistrer</button>
                          <button type="button" className="btn btn-outline" onClick={() => setIncomeModalOpen(false)}>Annuler</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {expenseModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Enregistrer une Dépense</h3>
                  <form onSubmit={saveExpense}>
                      <div className="form-group"><label>Titre de la dépense</label><input type="text" id="expenseTitle" required /></div>
                      <div className="form-row">
                          <div className="form-group"><label>Montant (FCFA)</label><input type="number" id="expenseAmount" required min="0" /></div>
                          <div className="form-group"><label>Date</label><input type="date" id="expenseDate" required /></div>
                      </div>
                      <div className="form-row">
                          <div className="form-group"><label>Domaine</label><select id="expenseCategory" required><option value="education">Éducation</option><option value="sante">Santé</option><option value="agriculture">Agriculture</option><option value="juridique">Juridique</option><option value="humanitaire">Humanitaire</option><option value="jeunesse">Jeunesse</option><option value="fonctionnement">Fonctionnement</option><option value="communication">Communication</option></select></div>
                          <div className="form-group"><label>Bénéficiaire</label><input type="text" id="expenseBeneficiary" /></div>
                      </div>
                      <div className="form-group"><label>Justification</label><textarea id="expenseDescription" required rows={3}></textarea></div>
                      <div className="alert-box info"><div className="alert-icon">ℹ️</div><div className="alert-content"><h4>Art. 16 Statuts</h4><p>La dépense sera soumise au Président pour cosignature.</p></div></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn btn-gold">Soumettre pour cosignature</button>
                          <button type="button" className="btn btn-outline" onClick={() => setExpenseModalOpen(false)}>Annuler</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {duesModalOpen.isOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
              <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '400px', width: '100%', padding: '24px' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Enregistrer une Cotisation</h3>
                  <form onSubmit={saveDuesPayment}>
                      <div className="form-group"><label>Membre</label><input type="text" value={duesModalOpen.memberName} disabled style={{ opacity: 0.7 }} /></div>
                      <div className="form-row">
                          <div className="form-group"><label>Montant (FCFA)</label><input type="number" id="duesAmount" defaultValue={duesModalOpen.amount} required min="0" /></div>
                          <div className="form-group"><label>Période</label><select id="duesPeriod" required><option value="2026">2026</option><option value="2027">2027</option></select></div>
                      </div>
                      <div className="form-group"><label>Mode de paiement</label><select id="duesPayment" required><option value="orange_money">Orange Money</option><option value="moov_money">Moov Money</option><option value="airtel_money">Airtel Money</option><option value="especes">Espèces</option></select></div>
                      <div className="form-group"><label>Référence</label><input type="text" id="duesReference" /></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" className="btn btn-gold">Enregistrer</button>
                          <button type="button" className="btn btn-outline" onClick={() => setDuesModalOpen({ isOpen: false, memberId: '', memberName: '', amount: 0 })}>Annuler</button>
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
