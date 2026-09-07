import fs from 'fs';
let file = fs.readFileSync('src/pages/dashboard/SecretaireDashboard.tsx', 'utf8');

// Add states
if (!file.includes('const [boardMessages, setBoardMessages]')) {
  file = file.replace('const [meetings, setMeetings] = useState<any[]>([]);', `const [meetings, setMeetings] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [courriers, setCourriers] = useState<any[]>([]);`);
}

// Add subscriptions
if (!file.includes('unsubBoardMessages')) {
  file = file.replace('const unsubMeetings = onSnapshot', `const unsubBoardMessages = onSnapshot(query(collection(db, 'board_messages'), orderBy('timestamp', 'asc')), (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubCourriers = onSnapshot(query(collection(db, 'courriers'), orderBy('date', 'desc')), (snap) => setCourriers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubMeetings = onSnapshot`);
    
  file = file.replace('return () => { unsubMembers(); unsubDocs(); unsubPV(); unsubConvos(); unsubMod(); unsubMeetings(); };', 
    'return () => { unsubMembers(); unsubDocs(); unsubPV(); unsubConvos(); unsubMod(); unsubMeetings(); unsubBoardMessages(); unsubTasks(); unsubCourriers(); };');
}

// Add tabs to nav
if (!file.includes('activeTab === \'messages\'')) {
  file = file.replace('<button className={`tab-btn ${activeTab === \'members\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'members\')}><span className="tab-icon">👥</span><span>Membres</span></button>',
    `<button className={\`tab-btn \${activeTab === 'courriers' ? 'active' : ''}\`} onClick={() => setActiveTab('courriers')}><span className="tab-icon">📬</span><span>Courriers</span></button>
          <button className={\`tab-btn \${activeTab === 'tasks' ? 'active' : ''}\`} onClick={() => setActiveTab('tasks')}><span className="tab-icon">📋</span><span>Tâches</span></button>
          <button className={\`tab-btn \${activeTab === 'messages' ? 'active' : ''}\`} onClick={() => setActiveTab('messages')}><span className="tab-icon">💬</span><span>Messages</span></button>
          <button className={\`tab-btn \${activeTab === 'members' ? 'active' : ''}\`} onClick={() => setActiveTab('members')}><span className="tab-icon">👥</span><span>Membres</span></button>`);
          
  file = file.replace('<nav className="tab-nav">', '<nav className="tab-nav" style={{ overflowX: \'auto\', whiteSpace: \'nowrap\', paddingBottom: \'8px\' }}>');
}

// Add tab contents
if (!file.includes('TAB COURRIERS')) {
  file = file.replace('{/* BOTTOM NAV */}', 
  `{/* TAB COURRIERS */}
      <div className={\`tab-content \${activeTab === 'courriers' ? 'active' : ''}\`}>
        <div className="section-header"><h2>📬 Courrier (Entrant / Sortant)</h2><p>Registre officiel des correspondances</p></div>
        <div className="card">
            {courriers.map(c => (
                <div key={c.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{c.objet}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>{c.type === 'entrant' ? 'Reçu le' : 'Envoyé le'} {new Date(c.date?.seconds * 1000).toLocaleDateString('fr-FR')} • {c.expediteur_destinataire}</div>
                    </div>
                    <span className={\`badge \${c.type === 'entrant' ? 'badge-success' : 'badge-warning'}\`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{c.type === 'entrant' ? 'Entrant' : 'Sortant'}</span>
                </div>
            ))}
            {courriers.length === 0 && <div className="empty-state">Aucun courrier enregistré.</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const obj = (document.getElementById('cObjet')).value;
                const tiers = (document.getElementById('cTiers')).value;
                const type = (document.getElementById('cType')).value;
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

      {/* TAB TASKS */}
      <div className={\`tab-content \${activeTab === 'tasks' ? 'active' : ''}\`}>
        <div className="section-header"><h2>📋 Mes Tâches</h2><p>Tâches assignées par le Président / VP</p></div>
        <div className="card">
            {tasks.filter(t => t.assignedTo === 'secretaire').map(t => (
                <div key={t.id} className="transaction-item" style={{ alignItems: 'flex-start', padding: '12px', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title" style={{ fontWeight: 'bold' }}>{t.title}</div>
                        <div className="transaction-meta" style={{ fontSize: '12px', color: '#666' }}>Assigné par: {t.createdBy}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px' }}>{t.description}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span className={\`badge \${t.completed ? 'badge-success' : 'badge-warning'}\`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{t.completed ? 'Terminé' : 'En cours'}</span>
                        <button className="btn btn-outline btn-small" style={{ fontSize: '11px', padding: '2px 8px' }} onClick={async () => {
                            await updateDoc(doc(db, 'tasks', t.id), { completed: !t.completed, completedAt: !t.completed ? serverTimestamp() : null });
                        }}>
                            {t.completed ? 'Rouvrir' : 'Terminer'}
                        </button>
                    </div>
                </div>
            ))}
            {tasks.filter(t => t.assignedTo === 'secretaire').length === 0 && <div className="empty-state">Aucune tâche assignée.</div>}
        </div>
      </div>

      {/* TAB MESSAGES */}
      <div className={\`tab-content \${activeTab === 'messages' ? 'active' : ''}\`}>
        <div className="section-header"><h2>💬 Chat Bureau</h2><p>Communication interne du Bureau Exécutif</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', background: 'var(--fond-alterne)', borderRadius: '8px', marginBottom: '12px' }}>
                {boardMessages.map(m => (
                    <div key={m.id} style={{ marginBottom: '12px', padding: '8px', background: m.role === 'secretaire' ? '#E0F2FE' : '#fff', borderRadius: '8px', alignSelf: m.role === 'secretaire' ? 'flex-end' : 'flex-start', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', marginBottom: '2px' }}>{m.sender} ({m.role}) - {m.timestamp ? new Date(m.timestamp.seconds * 1000).toLocaleDateString('fr-FR') : ''}</div>
                        <div style={{ fontSize: '14px' }}>{m.text}</div>
                    </div>
                ))}
            </div>
            <form style={{ display: 'flex', gap: '8px' }} onSubmit={async (e) => {
                e.preventDefault();
                const input = document.getElementById('secChatMsg');
                if(input.value.trim()) {
                    await addDoc(collection(db, 'board_messages'), { text: input.value, sender: 'Secrétaire Général', role: 'secretaire', timestamp: serverTimestamp() });
                    input.value = '';
                }
            }}>
                <input type="text" id="secChatMsg" className="search-input" style={{ flex: 1, padding: '8px 12px', backgroundImage: 'none' }} placeholder="Votre message..." required />
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Envoyer</button>
            </form>
        </div>
      </div>

      {/* BOTTOM NAV */}`);
}

fs.writeFileSync('src/pages/dashboard/SecretaireDashboard.tsx', file);
