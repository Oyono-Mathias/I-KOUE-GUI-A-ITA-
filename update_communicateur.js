import fs from 'fs';
let file = fs.readFileSync('src/pages/communication/CommunicateurDashboard.tsx', 'utf8');

if (!file.includes('const [boardMessages, setBoardMessages]')) {
  file = file.replace('const [messages, setMessages] = useState<any[]>([]);', `const [messages, setMessages] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [editorialCalendar, setEditorialCalendar] = useState<any[]>([]);`);
}

if (!file.includes('unsubBoardMessages')) {
  file = file.replace('const mediaQuery = query(collection(db, \'media\'), orderBy(\'uploadedAt\', \'desc\'));', 
    `const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
      const boardQuery = query(collection(db, 'board_messages'), orderBy('timestamp', 'asc'));
      const calendarQuery = query(collection(db, 'editorial_calendar'), orderBy('date', 'desc'));`);
      
  file = file.replace('const unsubMedia = onSnapshot(mediaQuery, (snap) => {', 
    `const unsubBoardMessages = onSnapshot(boardQuery, (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubCalendar = onSnapshot(calendarQuery, (snap) => setEditorialCalendar(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubMedia = onSnapshot(mediaQuery, (snap) => {`);
      
  file = file.replace('return () => { unsubNews(); unsubDomains(); unsubMessages(); unsubMedia(); };', 
    'return () => { unsubNews(); unsubDomains(); unsubMessages(); unsubMedia(); unsubBoardMessages(); unsubCalendar(); };');
}

if (!file.includes('activeTab === \'board_messages\'')) {
  file = file.replace('<span className="tab-icon">💬</span>\n          <span>Messages</span>\n        </button>', 
    `<span className="tab-icon">🌍</span>
          <span>Public</span>
        </button>
        <button 
          className={\`tab-btn \${activeTab === 'board_messages' ? 'active' : ''}\`} 
          onClick={() => { setActiveTab('board_messages'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">💬</span>
          <span>Bureau</span>
        </button>
        <button 
          className={\`tab-btn \${activeTab === 'calendrier' ? 'active' : ''}\`} 
          onClick={() => { setActiveTab('calendrier'); window.scrollTo(0, 0); }}
        >
          <span className="tab-icon">📅</span>
          <span>Calendrier</span>
        </button>`);
}

if (!file.includes('TAB BOARD MESSAGES')) {
  file = file.replace('{/* ============================================', 
  `{/* TAB BOARD MESSAGES */}
      <div className={\`tab-content \${activeTab === 'board_messages' ? 'active' : ''}\`}>
        <div className="section-header"><h2>💬 Chat Bureau</h2><p>Communication interne du Bureau Exécutif</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', background: 'var(--fond-alterne)', borderRadius: '8px', marginBottom: '12px' }}>
                {boardMessages.map(m => (
                    <div key={m.id} style={{ marginBottom: '12px', padding: '8px', background: m.role === 'communicateur' ? '#E0F2FE' : '#fff', borderRadius: '8px', alignSelf: m.role === 'communicateur' ? 'flex-end' : 'flex-start', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}>{m.sender} ({m.role}) - {m.timestamp ? new Date(m.timestamp.seconds * 1000).toLocaleDateString('fr-FR') : ''}</div>
                        <div style={{ fontSize: '14px' }}>{m.text}</div>
                    </div>
                ))}
            </div>
            <form style={{ display: 'flex', gap: '8px' }} onSubmit={async (e) => {
                e.preventDefault();
                const input = document.getElementById('comChatMsg');
                if(input.value.trim()) {
                    await addDoc(collection(db, 'board_messages'), { text: input.value, sender: 'Chargé de Communication', role: 'communicateur', timestamp: serverTimestamp() });
                    input.value = '';
                }
            }}>
                <input type="text" id="comChatMsg" className="search-input" style={{ flex: 1, padding: '8px 12px', backgroundImage: 'none' }} placeholder="Votre message..." required />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Envoyer</button>
            </form>
        </div>
      </div>

      {/* TAB CALENDRIER */}
      <div className={\`tab-content \${activeTab === 'calendrier' ? 'active' : ''}\`}>
        <div className="section-header"><h2>📅 Calendrier Éditorial</h2><p>Planification des publications sociales et médias</p></div>
        <div className="card">
            {editorialCalendar.map(c => (
                <div key={c.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{c.titre}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>Canal: {c.canal} • Date prévue: {new Date(c.date?.seconds * 1000).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span className={\`badge \${c.status === 'publie' ? 'badge-success' : 'badge-warning'}\`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{c.status === 'publie' ? 'Publié' : 'Planifié'}</span>
                </div>
            ))}
            {editorialCalendar.length === 0 && <div className="empty-state">Aucune publication planifiée.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const obj = (document.getElementById('calTitle')).value;
                const canal = (document.getElementById('calCanal')).value;
                const date = (document.getElementById('calDate')).value;
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

      {/* ============================================`);
}

fs.writeFileSync('src/pages/communication/CommunicateurDashboard.tsx', file);
