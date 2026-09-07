import fs from 'fs';
let file = fs.readFileSync('src/pages/dashboard/SecretaireDashboard.tsx', 'utf8');

file = file.replace('<nav className="bottom-nav">', '<nav className="bottom-nav" style={{ overflowX: \'auto\', whiteSpace: \'nowrap\', display: \'flex\', flexWrap: \'nowrap\', justifyContent: \'flex-start\' }}>');

if (!file.includes('nav-icon">💬')) {
  file = file.replace('<button className={activeTab === \'archives\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'archives\')}><span className="nav-icon">🗂️</span><span>Archives</span></button>',
    `<button className={activeTab === 'courriers' ? 'active' : ''} onClick={() => setActiveTab('courriers')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">📬</span><span>Courriers</span></button>
          <button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">📋</span><span>Tâches</span></button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">💬</span><span>Messages</span></button>
          <button className={activeTab === 'archives' ? 'active' : ''} onClick={() => setActiveTab('archives')} style={{ minWidth: '80px', flex: '0 0 auto' }}><span className="nav-icon">🗂️</span><span>Archives</span></button>`);
          
  file = file.replace('<button className={activeTab === \'dashboard\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'dashboard\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'dashboard\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'dashboard\'');
  file = file.replace('<button className={activeTab === \'pv\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'pv\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'pv\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'pv\'');
  file = file.replace('<button className={activeTab === \'convocations\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'convocations\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} className={activeTab === \'convocations\' ? \'active\' : \'\'} onClick={() => setActiveTab(\'convocations\'');
}

fs.writeFileSync('src/pages/dashboard/SecretaireDashboard.tsx', file);
