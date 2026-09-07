import fs from 'fs';
let file = fs.readFileSync('src/pages/communication/CommunicateurDashboard.tsx', 'utf8');

if (!file.includes('nav-icon">📅')) {
  file = file.replace('<button onClick={() => { setActiveTab(\'messages\'); window.scrollTo(0, 0); }} className={activeTab === \'messages\' ? \'active\' : \'\'}>',
    `<button onClick={() => { setActiveTab('board_messages'); window.scrollTo(0, 0); }} className={activeTab === 'board_messages' ? 'active' : ''} style={{ minWidth: '80px', flex: '0 0 auto' }}>
          <span className="nav-icon">💬</span>
          <span>Bureau</span>
        </button>
        <button onClick={() => { setActiveTab('calendrier'); window.scrollTo(0, 0); }} className={activeTab === 'calendrier' ? 'active' : ''} style={{ minWidth: '80px', flex: '0 0 auto' }}>
          <span className="nav-icon">📅</span>
          <span>Calendrier</span>
        </button>
        <button onClick={() => { setActiveTab('messages'); window.scrollTo(0, 0); }} className={activeTab === 'messages' ? 'active' : ''} style={{ minWidth: '80px', flex: '0 0 auto' }}>`);
        
  file = file.replace('<nav className="bottom-nav">', '<nav className="bottom-nav" style={{ overflowX: \'auto\', whiteSpace: \'nowrap\', display: \'flex\', flexWrap: \'nowrap\', justifyContent: \'flex-start\' }}>');
  file = file.replace('<button onClick={() => { setActiveTab(\'dashboard\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} onClick={() => { setActiveTab(\'dashboard\'');
  file = file.replace('<button onClick={() => { setActiveTab(\'news\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} onClick={() => { setActiveTab(\'news\'');
  file = file.replace('<button onClick={() => { setActiveTab(\'analytics\'', '<button style={{ minWidth: \'80px\', flex: \'0 0 auto\' }} onClick={() => { setActiveTab(\'analytics\'');
}

fs.writeFileSync('src/pages/communication/CommunicateurDashboard.tsx', file);
