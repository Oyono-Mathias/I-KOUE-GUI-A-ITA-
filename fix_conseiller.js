import fs from 'fs';

let conseillerPath = 'src/pages/dashboard/ConseillerDashboard.tsx';
let cContent = fs.readFileSync(conseillerPath, 'utf8');

if (!cContent.includes('const [commissions')) {
  const cStates = `  const [commissions, setCommissions] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [suppleanceHistory, setSuppleanceHistory] = useState<any[]>([]);
  const [isSuppleanceActive, setIsSuppleanceActive] = useState(false);
`;
  cContent = cContent.replace(
    /const \[documents, setDocuments\] = useState<any\[\]>\(\[\]\);/g,
    `const [documents, setDocuments] = useState<any[]>([]);\n${cStates}`
  );

  const cListeners = `    const unsubCommissions = onSnapshot(query(collection(db, 'commissions'), orderBy('createdAt', 'desc')), (snap) => setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleance = onSnapshot(query(collection(db, 'suppleance_history'), orderBy('date', 'desc')), (snap) => setSuppleanceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleanceState = onSnapshot(doc(db, 'system', 'suppleance'), (docSnap) => {
      if (docSnap.exists()) setIsSuppleanceActive(docSnap.data().active || false);
    });
`;
  cContent = cContent.replace(
    /const unsubDocs = onSnapshot.*?setDocuments.*?;/g,
    `const unsubDocs = onSnapshot(query(collection(db, 'documents'), orderBy('date', 'desc')), (snap) => setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));\n${cListeners}`
  );
  
  cContent = cContent.replace(
    /return \(\) => \{ unsubAvis\(\); unsubRapports\(\); unsubPartners\(\); unsubDocs\(\); unsubMeetings\(\); unsubBoardMessages\(\); unsubProjets\(\); \};/g,
    `return () => { unsubAvis(); unsubRapports(); unsubPartners(); unsubDocs(); unsubMeetings(); unsubBoardMessages(); unsubProjets(); unsubCommissions(); unsubTasks(); unsubSuppleance(); unsubSuppleanceState(); };`
  );

  // Tabs
  cContent = cContent.replace(
    /<button className=\{\`tab-btn \$\{\s*activeTab === 'veille'\s*\?\s*'active'\s*:\s*''\s*\}\`\} onClick=\{\(\) => setActiveTab\('veille'\)\}/g,
    `<button className={\`tab-btn \${activeTab === 'veille' ? 'active' : ''}\`} onClick={() => setActiveTab('veille')}><span className="tab-icon">📚</span><span>Veille</span></button>
            <button className={\`tab-btn \${activeTab === 'tasks' ? 'active' : ''}\`} onClick={() => setActiveTab('tasks')}><span className="tab-icon">📋</span><span>Tâches</span></button>
            <button className={\`tab-btn \${activeTab === 'suppleance' ? 'active' : ''}\`} onClick={() => setActiveTab('suppleance')}><span className="tab-icon">⚡</span><span>Suppléance</span></button>`
  );
  
  cContent = cContent.replace(
    /<button className=\{activeTab === 'partenaires' \? 'active' : ''\} onClick=\{\(\) => setActiveTab\('partenaires'\)\}/g,
    `<button className={activeTab === 'partenaires' ? 'active' : ''} onClick={() => setActiveTab('partenaires')}><span className="nav-icon">🤝</span><span>Partenaires</span></button>
            <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">📋</span><span>Tâches</span></button>`
  );

  // Banner
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
  cContent = cContent.replace(
    /<div className="welcome-card">/g,
    bannerHtml + '\n          <div className="welcome-card">'
  );

  // Contents
  const contentHtml = `
      {/* TAB TASKS */}
      <div className={\`tab-content \${activeTab === 'tasks' ? 'active' : ''}\`}>
        <div className="section-header"><h2>📋 Mes Tâches</h2><p>Tâches assignées au Conseiller</p></div>
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

      {/* TAB SUPPLEANCE */}
      <div className={\`tab-content \${activeTab === 'suppleance' ? 'active' : ''}\`}>
        <div className="section-header"><h2>⚡ Historique de Suppléance</h2></div>
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
`;
  cContent = cContent.replace(
    /\{\/\* BOTTOM NAV \*\/\}/g,
    contentHtml + '\n      {/* BOTTOM NAV */}'
  );
  
  // Replace static commission list with dynamic
  cContent = cContent.replace(
    /<div className="empty-state"><div className="empty-icon">📂<\/div><h3>Aucun projet en cours<\/h3><\/div>/g,
    `<div className="empty-state"><div className="empty-icon">📂</div><h3>Aucun projet en cours</h3></div>
            <h3 className="card-title" style={{ marginTop: '24px' }}>Toutes les commissions</h3>
            <div className="stats-grid">
                {commissions.map(c => (
                    <div key={c.id} className="stat-card">
                        <div className="stat-label">{c.name}</div>
                        <div className="stat-sublabel">Resp: {c.lead}</div>
                        <div className="stat-value" style={{ fontSize: '14px', marginTop: '8px' }}>{c.status || 'Actif'}</div>
                    </div>
                ))}
            </div>`
  );

  fs.writeFileSync(conseillerPath, cContent);
}
