import fs from 'fs';

let path = 'src/pages/dashboard/ConseillerDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix line 232
content = content.replace(
  /<button className=\{\`tab-btn \$\{\s*activeTab === 'suppleance'\s*\?\s*'active'\s*:\s*''\s*\}\`\} onClick=\{\(\) => setActiveTab\('suppleance'\)\}>\s*<span className="tab-icon">⚡<\/span>\s*<span>Suppléance<\/span>\s*<\/button>><span className="tab-icon">📚<\/span><span>Veille<\/span><\/button>/g,
  `<button className={\`tab-btn \${activeTab === 'suppleance' ? 'active' : ''}\`} onClick={() => setActiveTab('suppleance')}><span className="tab-icon">⚡</span><span>Suppléance</span></button>`
);

// Fix line 431
content = content.replace(
  /<button className=\{activeTab === 'tasks' \? 'active' : ''\} onClick=\{\(\) => setActiveTab\('tasks'\)\}><span className="nav-icon">📋<\/span><span>Tâches<\/span><\/button>><span className="nav-icon">🤝<\/span><span>Partenaires<\/span><\/button>/g,
  `<button className={activeTab === 'tasks' ? 'active' : ''} onClick={() => setActiveTab('tasks')}><span className="nav-icon">📋</span><span>Tâches</span></button>`
);

fs.writeFileSync(path, content);
