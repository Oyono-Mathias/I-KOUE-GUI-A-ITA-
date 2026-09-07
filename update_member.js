import fs from 'fs';
let file = fs.readFileSync('src/pages/dashboard/MemberDashboard.tsx', 'utf8');

if (!file.includes('const [forumPosts, setForumPosts] = useState<any[]>([]);')) {
  file = file.replace('const [documents, setDocuments] = useState<any[]>([]);', `const [documents, setDocuments] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);`);
}

if (!file.includes('unsubForum')) {
  file = file.replace('const unsubDocs = onSnapshot', `const unsubForum = onSnapshot(query(collection(db, 'forum'), orderBy('createdAt', 'desc')), (snap) => setForumPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEvents = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc')), (snap) => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDocs = onSnapshot`);
    
  file = file.replace('unsubDocs();', 
    'unsubDocs(); unsubForum(); unsubEvents();');
}

if (!file.includes('activeTab === \'forum\'')) {
  file = file.replace('<button className={`tab-btn ${activeTab === \'voting\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'voting\')}>Voter</button>',
    `<button className={\`tab-btn \${activeTab === 'voting' ? 'active' : ''}\`} onClick={() => setActiveTab('voting')}>Voter</button>
          <button className={\`tab-btn \${activeTab === 'forum' ? 'active' : ''}\`} onClick={() => setActiveTab('forum')}>Forum</button>
          <button className={\`tab-btn \${activeTab === 'events' ? 'active' : ''}\`} onClick={() => setActiveTab('events')}>Événements</button>`);
}

if (!file.includes('TAB FORUM')) {
  file = file.replace('{/* Voting Tab */}', 
  `{/* TAB FORUM */}
        <div className={\`tab-content \${activeTab === 'forum' ? 'active' : ''}\`}>
          <div className="section-header">
            <h2>💬 Forum de la Communauté</h2>
            <p>Échangez avec les autres membres (Art. 4 RI)</p>
          </div>
          <div className="card">
            {forumPosts.map(p => (
              <div key={p.id} style={{ padding: '16px', borderBottom: '1px solid #eee', marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--bleu-rca)', fontSize: '15px' }}>{p.author} <span style={{ fontSize: '11px', color: '#888', fontWeight: 'normal' }}>- {p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('fr-FR') : ''}</span></div>
                <div style={{ marginTop: '8px', fontSize: '14px', lineHeight: '1.5' }}>{p.message}</div>
              </div>
            ))}
            {forumPosts.length === 0 && <div className="empty-state">Soyez le premier à lancer une discussion !</div>}
            <form onSubmit={async (e) => {
                e.preventDefault();
                const msg = (document.getElementById('forumMsg')).value;
                if(msg) {
                    await addDoc(collection(db, 'forum'), { message: msg, author: userData?.displayName || 'Membre', memberId: userData?.uid, createdAt: serverTimestamp() });
                    e.target.reset();
                }
            }} style={{ marginTop: '20px' }}>
                <textarea id="forumMsg" rows={3} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} placeholder="Partagez une idée ou posez une question..." required></textarea>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>Publier</button>
            </form>
          </div>
        </div>

        {/* TAB EVENTS */}
        <div className={\`tab-content \${activeTab === 'events' ? 'active' : ''}\`}>
          <div className="section-header">
            <h2>📅 Événements & Assemblées</h2>
            <p>Calendrier de l'association</p>
          </div>
          <div className="card">
            {events.map(e => (
              <div key={e.id} style={{ padding: '16px', borderLeft: '4px solid var(--or-solaire)', background: 'var(--fond-alterne)', marginBottom: '12px', borderRadius: '8px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{e.titre || e.type}</div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Date: {e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '-'} • Lieu: {e.lieu || 'Non spécifié'}</div>
                {e.description && <div style={{ marginTop: '8px', fontSize: '14px' }}>{e.description}</div>}
              </div>
            ))}
            {events.length === 0 && <div className="empty-state">Aucun événement à venir.</div>}
          </div>
        </div>

        {/* Voting Tab */}`);
}

fs.writeFileSync('src/pages/dashboard/MemberDashboard.tsx', file);
