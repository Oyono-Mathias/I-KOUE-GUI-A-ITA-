import fs from 'fs';
let file = fs.readFileSync('src/pages/dashboard/TresorierDashboard.tsx', 'utf8');

// Add states
if (!file.includes('const [boardMessages, setBoardMessages]')) {
  file = file.replace('const [expenses, setExpenses] = useState<any[]>([]);', `const [expenses, setExpenses] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);`);
}

// Add subscriptions
if (!file.includes('unsubBoardMessages')) {
  file = file.replace('const unsubExpenses = onSnapshot', `const unsubBoardMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubFactures = onSnapshot(query(collection(db, 'factures'), orderBy('date', 'desc')), (snap) => setFactures(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubExpenses = onSnapshot`);
    
  file = file.replace('return () => { unsubMembers(); unsubIncome(); unsubExpenses(); };', 
    'return () => { unsubMembers(); unsubIncome(); unsubExpenses(); unsubBoardMessages(); unsubFactures(); };');
}

// Add tabs to nav
if (!file.includes('activeTab === \'messages\'')) {
  file = file.replace('<button className={`tab-btn ${activeTab === \'reports\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'reports\')}><span className="tab-icon">📊</span><span>Rapports</span></button>',
    `<button className={\`tab-btn \${activeTab === 'factures' ? 'active' : ''}\`} onClick={() => setActiveTab('factures')}><span className="tab-icon">🧾</span><span>Factures</span></button>
          <button className={\`tab-btn \${activeTab === 'messages' ? 'active' : ''}\`} onClick={() => setActiveTab('messages')}><span className="tab-icon">💬</span><span>Messages</span></button>
          <button className={\`tab-btn \${activeTab === 'reports' ? 'active' : ''}\`} onClick={() => setActiveTab('reports')}><span className="tab-icon">📊</span><span>Rapports</span></button>`);
          
  file = file.replace('<nav className="tab-nav">', '<nav className="tab-nav" style={{ overflowX: \'auto\', whiteSpace: \'nowrap\', paddingBottom: \'8px\' }}>');
}

// Add tab contents
if (!file.includes('TAB FACTURES')) {
  file = file.replace('{/* BOTTOM NAV */}', 
  `{/* TAB FACTURES */}
      <div className={\`tab-content \${activeTab === 'factures' ? 'active' : ''}\`}>
        <div className="section-header"><h2>🧾 Gestion des Factures</h2><p>Suivi des factures fournisseurs et justificatifs</p></div>
        <div className="card">
            {factures.map(f => (
                <div key={f.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{f.fournisseur}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>Montant: {Number(f.montant).toLocaleString()} F • Échéance: {new Date(f.date?.seconds * 1000).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span className={\`badge \${f.status === 'payee' ? 'badge-success' : 'badge-warning'}\`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{f.status === 'payee' ? 'Payée' : 'En attente'}</span>
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
      <div className={\`tab-content \${activeTab === 'messages' ? 'active' : ''}\`}>
        <div className="section-header"><h2>💬 Chat Bureau</h2><p>Communication interne du Bureau Exécutif</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', background: 'var(--fond-alterne)', borderRadius: '8px', marginBottom: '12px' }}>
                {boardMessages.map(m => (
                    <div key={m.id} style={{ marginBottom: '12px', padding: '8px', background: m.role === 'tresorier' ? '#E0F2FE' : '#fff', borderRadius: '8px', alignSelf: m.role === 'tresorier' ? 'flex-end' : 'flex-start', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}>{m.sender} ({m.role}) - {m.timestamp ? new Date(m.timestamp.seconds * 1000).toLocaleDateString('fr-FR') : ''}</div>
                        <div style={{ fontSize: '14px' }}>{m.text}</div>
                    </div>
                ))}
            </div>
            <form style={{ display: 'flex', gap: '8px' }} onSubmit={async (e) => {
                e.preventDefault();
                const input = document.getElementById('tresChatMsg') as HTMLInputElement;
                if(input.value.trim()) {
                    await addDoc(collection(db, 'board_messages'), { text: input.value, sender: 'Trésorier Général', role: 'tresorier', timestamp: serverTimestamp() });
                    input.value = '';
                }
            }}>
                <input type="text" id="tresChatMsg" className="search-input" style={{ flex: 1, padding: '8px 12px', backgroundImage: 'none' }} placeholder="Votre message..." required />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Envoyer</button>
            </form>
        </div>
      </div>

      {/* BOTTOM NAV */}`);
}

file = file.replace('<nav className="bottom-nav">', '<nav className="bottom-nav" style={{ overflowX: \'auto\', whiteSpace: \'nowrap\', display: \'flex\', flexWrap: \'nowrap\', justifyContent: \'flex-start\' }}>');

if (!file.includes('nav-icon">💬')) {
  file = file.replace('<button className={activeTab === \'dues\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'dues\')}><span className="nav-icon">👥</span><span>Cotisations</span></button>',
    `<button className={activeTab === 'dues' ? 'active' : ''} onClick={() => setActiveTab('dues')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">👥</span><span>Cotisations</span></button>
          <button className={activeTab === 'factures' ? 'active' : ''} onClick={() => setActiveTab('factures')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">🧾</span><span>Factures</span></button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💬</span><span>Messages</span></button>`);
          
  file = file.replace('<button className={activeTab === \'dashboard\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'dashboard\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'dashboard\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'dashboard\'');
  file = file.replace('<button className={activeTab === \'income\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'income\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'income\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'income\'');
  file = file.replace('<button className={activeTab === \'expenses\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'expenses\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'expenses\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'expenses\'');
}

fs.writeFileSync('src/pages/dashboard/TresorierDashboard.tsx', file);
