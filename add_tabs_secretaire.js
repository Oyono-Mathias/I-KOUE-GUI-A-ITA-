import fs from 'fs';

const path = 'src/pages/dashboard/SecretaireDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add to top navigation
content = content.replace(
  /<button className=\{\`tab-btn \$\{\s*activeTab === 'tasks'\s*\?\s*'active'\s*:\s*''\s*\}\`\} onClick=\{\(\) => setActiveTab\('tasks'\)\}/g,
  `<button className={\`tab-btn \${activeTab === 'commissions' ? 'active' : ''}\`} onClick={() => setActiveTab('commissions')}><span className="tab-icon">🏛️</span><span>Commissions</span></button>
          <button className={\`tab-btn \${activeTab === 'suppleance' ? 'active' : ''}\`} onClick={() => setActiveTab('suppleance')}><span className="tab-icon">⚡</span><span>Suppléance</span></button>
          <button className={\`tab-btn \${activeTab === 'tasks' ? 'active' : ''}\`} onClick={() => setActiveTab('tasks')}`
);

// Add bottom navigation (mobile)
content = content.replace(
  /<button className=\{activeTab === 'tasks' \? 'active' : ''\} onClick=\{\(\) => setActiveTab\('tasks'\)/g,
  `<button className={activeTab === 'commissions' ? 'active' : ''} onClick={() => setActiveTab('commissions')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">🏛️</span><span>Comm.</span></button>
          <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}`
);

// Add Suppléance mode toggle function
const suppleanceFunc = `  const toggleSuppleance = async () => {
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
`;
content = content.replace(
  /const savePV = async/g,
  suppleanceFunc + '\n  const savePV = async'
);

// Add Suppleance Banner in Dashboard
const bannerHtml = `
      {isSuppleanceActive && (
          <div className="alert-box" style={{ background: '#fff3e0', borderColor: '#ff9800', marginBottom: '16px', margin: '0 16px' }}>
              <div className="alert-icon">⚡</div>
              <div className="alert-content">
                  <h4>Mode Suppléance Actif</h4>
                  <p>Le Président est actuellement suppléé.</p>
              </div>
          </div>
      )}
`;
content = content.replace(
  /<div className="welcome-card">/g,
  bannerHtml + '\n          <div className="welcome-card">'
);


// Add Tab Contents
const newTabs = `
      {/* TAB COMMISSIONS */}
      <div className={\`tab-content \${activeTab === 'commissions' ? 'active' : ''}\`}>
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
      <div className={\`tab-content \${activeTab === 'suppleance' ? 'active' : ''}\`}>
        <div className="section-header"><h2>⚡ Mode Suppléance</h2><p>Gestion et historique du mode suppléance</p></div>
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Statut actuel : {isSuppleanceActive ? '🟢 Actif' : '⚪ Inactif'}</h3>
                    <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Le mode suppléance permet au VP de remplacer le Président.</p>
                </div>
                <button className={\`btn \${isSuppleanceActive ? 'btn-outline' : 'btn-gold'}\`} onClick={toggleSuppleance}>
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
`;

content = content.replace(
  /\{\/\* TAB TASKS \*\/\}/g,
  newTabs + '\n      {/* TAB TASKS */}'
);

// Allow editing tasks for Secretary (if they want to create/assign tasks like the VP)
const taskCreationForm = `
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
`;

content = content.replace(
  /<div className="section-header"><h2>📋 Mes Tâches<\/h2><p>Tâches assignées par le Président \/ VP<\/p><\/div>/g,
  `<div className="section-header"><h2>📋 Tâches & Délégation</h2><p>Gestion des tâches du bureau</p></div>
${taskCreationForm}`
);

// We need to change the tasks filter since Secretary can now see all tasks or just theirs. 
// We will let Secretary see all tasks to read and write in real-time as requested.
content = content.replace(
  /tasks\.filter\(t => t\.assignedTo === 'secretaire'\)\.map/g,
  `tasks.map`
);

content = content.replace(
  /tasks\.filter\(t => t\.assignedTo === 'secretaire'\)\.length === 0/g,
  `tasks.length === 0`
);

content = content.replace(
  /Assigné par: \{t\.createdBy\}/g,
  `Assigné à: {t.assignedTo} | Par: {t.createdBy}`
);

fs.writeFileSync(path, content);
