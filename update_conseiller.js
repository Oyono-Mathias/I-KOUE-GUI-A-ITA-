import fs from 'fs';
let file = fs.readFileSync('src/pages/dashboard/ConseillerDashboard.tsx', 'utf8');

if (!file.includes('const [boardMessages, setBoardMessages]')) {
  file = file.replace('const [avis, setAvis] = useState<any[]>([]);', `const [avis, setAvis] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [projets, setProjets] = useState<any[]>([]);`);
}

if (!file.includes('unsubBoardMessages')) {
  file = file.replace('const unsubAvis = onSnapshot', `const unsubBoardMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubProjets = onSnapshot(query(collection(db, 'projets'), orderBy('createdAt', 'desc')), (snap) => setProjets(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAvis = onSnapshot`);
    
  file = file.replace('return () => { unsubAvis(); unsubRapports(); unsubPartners(); unsubDocs(); unsubMeetings(); };', 
    'return () => { unsubAvis(); unsubRapports(); unsubPartners(); unsubDocs(); unsubMeetings(); unsubBoardMessages(); unsubProjets(); };');
}

if (!file.includes('activeTab === \'messages\'')) {
  file = file.replace('<button className={`tab-btn ${activeTab === \'reports\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'reports\')}><span className="tab-icon">📊</span><span>Rapports</span></button>',
    `<button className={\`tab-btn \${activeTab === 'projets' ? 'active' : ''}\`} onClick={() => setActiveTab('projets')}><span className="tab-icon">📈</span><span>Projets</span></button>
          <button className={\`tab-btn \${activeTab === 'messages' ? 'active' : ''}\`} onClick={() => setActiveTab('messages')}><span className="tab-icon">💬</span><span>Messages</span></button>
          <button className={\`tab-btn \${activeTab === 'reports' ? 'active' : ''}\`} onClick={() => setActiveTab('reports')}><span className="tab-icon">📊</span><span>Rapports</span></button>`);
          
  file = file.replace('<nav className="tab-nav">', '<nav className="tab-nav" style={{ overflowX: \'auto\', whiteSpace: \'nowrap\', paddingBottom: \'8px\' }}>');
}

if (!file.includes('TAB PROJETS')) {
  file = file.replace('{/* BOTTOM NAV */}', 
  `{/* TAB PROJETS */}
      <div className={\`tab-content \${activeTab === 'projets' ? 'active' : ''}\`}>
        <div className="section-header"><h2>📈 Évaluation des Projets</h2><p>Analyse et scoring des initiatives</p></div>
        <div className="card">
            {projets.map(p => (
                <div key={p.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{p.titre}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>Porteur: {p.porteur} • Budget: {Number(p.budget).toLocaleString()} F</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span className={\`badge \${p.score >= 70 ? 'badge-success' : 'badge-warning'}\`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>Score: {p.score || 0}/100</span>
                    </div>
                </div>
            ))}
            {projets.length === 0 && <div className="empty-state">Aucun projet à évaluer.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const obj = (document.getElementById('pTitre')).value;
                const porteur = (document.getElementById('pPorteur')).value;
                const score = (document.getElementById('pScore')).value;
                if(obj && porteur) {
                    await addDoc(collection(db, 'projets'), { titre: obj, porteur, score: Number(score), budget: 0, status: 'en_attente', createdAt: serverTimestamp() });
                    e.target.reset();
                }
            }} style={{ marginTop: '20px' }}>
                <h3 className="card-title">Ajouter une évaluation</h3>
                <div className="form-row" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input type="text" id="pTitre" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Titre du projet" required />
                    <input type="text" id="pPorteur" className="search-input" style={{ flex: 1, padding: '8px' }} placeholder="Porteur (Membre)" required />
                    <input type="number" id="pScore" className="search-input" style={{ width: '80px', padding: '8px' }} placeholder="Score" required />
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
                    <div key={m.id} style={{ marginBottom: '12px', padding: '8px', background: m.role === 'conseiller' ? '#E0F2FE' : '#fff', borderRadius: '8px', alignSelf: m.role === 'conseiller' ? 'flex-end' : 'flex-start', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}>{m.sender} ({m.role}) - {m.timestamp ? new Date(m.timestamp.seconds * 1000).toLocaleDateString('fr-FR') : ''}</div>
                        <div style={{ fontSize: '14px' }}>{m.text}</div>
                    </div>
                ))}
            </div>
            <form style={{ display: 'flex', gap: '8px' }} onSubmit={async (e) => {
                e.preventDefault();
                const input = document.getElementById('consChatMsg');
                if(input.value.trim()) {
                    await addDoc(collection(db, 'board_messages'), { text: input.value, sender: 'Conseiller', role: 'conseiller', timestamp: serverTimestamp() });
                    input.value = '';
                }
            }}>
                <input type="text" id="consChatMsg" className="search-input" style={{ flex: 1, padding: '8px 12px', backgroundImage: 'none' }} placeholder="Votre message..." required />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Envoyer</button>
            </form>
        </div>
      </div>

      {/* BOTTOM NAV */}`);
}

file = file.replace('<nav className="bottom-nav">', '<nav className="bottom-nav" style={{ overflowX: \'auto\', whiteSpace: \'nowrap\', display: \'flex\', flexWrap: \'nowrap\', justifyContent: \'flex-start\' }}>');

if (!file.includes('nav-icon">💬')) {
  file = file.replace('<button className={activeTab === \'avis\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'avis\')}><span className="nav-icon">💡</span><span>Avis</span></button>',
    `<button className={activeTab === 'avis' ? 'active' : ''} onClick={() => setActiveTab('avis')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💡</span><span>Avis</span></button>
          <button className={activeTab === 'projets' ? 'active' : ''} onClick={() => setActiveTab('projets')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">📈</span><span>Projets</span></button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💬</span><span>Messages</span></button>`);
          
  file = file.replace('<button className={activeTab === \'dashboard\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'dashboard\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'dashboard\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'dashboard\'');
  file = file.replace('<button className={activeTab === \'partners\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'partners\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'partners\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'partners\'');
  file = file.replace('<button className={activeTab === \'meetings\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'meetings\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'meetings\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'meetings\'');
}

fs.writeFileSync('src/pages/dashboard/ConseillerDashboard.tsx', file);
