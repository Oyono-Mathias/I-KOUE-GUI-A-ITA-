import fs from 'fs';

const bannerHtml = `
      {isSuppleanceActive && (
          <div className="alert-box" style={{ background: '#fff3e0', borderColor: '#ff9800', marginBottom: '16px', margin: '0 16px' }}>
              <div className="alert-icon">⚡</div>
              <div className="alert-content">
                  <h4>Mode Suppléance Actif</h4>
                  <p>Le Président est actuellement suppléé par le Vice-Président.</p>
              </div>
          </div>
      )}
`;

// 2. MEMBER DASHBOARD
let memberPath = 'src/pages/dashboard/MemberDashboard.tsx';
let mContent = fs.readFileSync(memberPath, 'utf8');

if (!mContent.includes('const [commissions')) {
  const mStates = `  const [commissions, setCommissions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [suppleanceHistory, setSuppleanceHistory] = useState<any[]>([]);
  const [isSuppleanceActive, setIsSuppleanceActive] = useState(false);
`;
  mContent = mContent.replace(
    /const \[events, setEvents\] = useState<any\[\]>\(\[\]\);/g,
    `const [events, setEvents] = useState<any[]>([]);\n${mStates}`
  );

  const mListeners = `    const unsubCommissions = onSnapshot(query(collection(db, 'commissions'), orderBy('createdAt', 'desc')), (snap) => setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleance = onSnapshot(query(collection(db, 'suppleance_history'), orderBy('date', 'desc')), (snap) => setSuppleanceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleanceState = onSnapshot(doc(db, 'system', 'suppleance'), (docSnap) => {
      if (docSnap.exists()) setIsSuppleanceActive(docSnap.data().active || false);
    });
`;
  mContent = mContent.replace(
    /const unsubEvents = onSnapshot.*?setEvents.*?;/g,
    `const unsubEvents = onSnapshot(query(collection(db, 'ag_events'), orderBy('date', 'desc')), (snap) => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));\n${mListeners}`
  );
  
  mContent = mContent.replace(
    /return \(\) => \{ unsubNews\(\); unsubPayments\(\); unsubDocs\(\); unsubForum\(\); unsubEvents\(\); unsubNotifs\(\); unsubMissions\(\); \};/g,
    `return () => { unsubNews(); unsubPayments(); unsubDocs(); unsubForum(); unsubEvents(); unsubNotifs(); unsubMissions(); unsubCommissions(); unsubTasks(); unsubSuppleance(); unsubSuppleanceState(); };`
  );

  // Banner
  mContent = mContent.replace(
    /<div className="welcome-card">/g,
    bannerHtml + '\n        <div className="welcome-card">'
  );
  
  // Add Tabs
  mContent = mContent.replace(
    /<button className=\{\`tab-btn \$\{\s*activeTab === 'documents'\s*\?\s*'active'\s*:\s*''\s*\}\`\} onClick=\{\(\) => \{\s*setActiveTab\('documents'\);\s*window\.scrollTo\(0,0\);\s*\}\}/g,
    `<button className={\`tab-btn \${activeTab === 'commissions' ? 'active' : ''}\`} onClick={() => { setActiveTab('commissions'); window.scrollTo(0,0); }}>
          <span className="tab-icon">🏛️</span>
          <span>Commissions</span>
        </button>
        <button className={\`tab-btn \${activeTab === 'tasks' ? 'active' : ''}\`} onClick={() => { setActiveTab('tasks'); window.scrollTo(0,0); }}>
          <span className="tab-icon">📋</span>
          <span>Tâches</span>
        </button>
        <button className={\`tab-btn \${activeTab === 'documents' ? 'active' : ''}\`} onClick={() => { setActiveTab('documents'); window.scrollTo(0,0); }}`
  );
  
  mContent = mContent.replace(
    /<a onClick=\{\(\) => \{\s*setActiveTab\('droits'\);\s*window\.scrollTo\(0,0\);\s*\}\} className=\{activeTab === 'droits' \? 'active' : ''\}/g,
    `<a onClick={() => { setActiveTab('commissions'); window.scrollTo(0,0); }} className={activeTab === 'commissions' ? 'active' : ''}>
          <span className="nav-icon">🏛️</span>
          <span>Comm.</span>
        </a>
        <a onClick={() => { setActiveTab('tasks'); window.scrollTo(0,0); }} className={activeTab === 'tasks' ? 'active' : ''}>
          <span className="nav-icon">📋</span>
          <span>Tâches</span>
        </a>
        <a onClick={() => { setActiveTab('droits'); window.scrollTo(0,0); }} className={activeTab === 'droits' ? 'active' : ''}`
  );

  const mContentHtml = `
      {/* TAB COMMISSIONS */}
      <div className={\`tab-content \${activeTab === 'commissions' ? 'active' : ''}\`}>
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
      <div className={\`tab-content \${activeTab === 'tasks' ? 'active' : ''}\`}>
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
                        <span className={\`badge \${t.completed ? 'badge-success' : 'badge-warning'}\`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px' }}>{t.completed ? 'Terminé' : 'En cours'}</span>
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
`;
  mContent = mContent.replace(
    /\{\/\* TAB 4: DOCUMENTS \*\/\}/g,
    mContentHtml + '\n\n      {/* TAB 4: DOCUMENTS */}'
  );

  fs.writeFileSync(memberPath, mContent);
}

