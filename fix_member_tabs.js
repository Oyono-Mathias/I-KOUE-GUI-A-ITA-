import fs from 'fs';
let path = 'src/pages/dashboard/MemberDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Top nav
content = content.replace(
  /<button className=\{\`tab-btn \$\{\s*activeTab === 'documents'\s*\?\s*'active'\s*:\s*''\s*\}\`\} onClick=\{\(\) => \{\s*setActiveTab\('documents'\);\s*window\.scrollTo\(0,0\);\s*\}\}>\n\s*<span className="tab-icon">📁<\/span>\n\s*<span>Documents<\/span>\n\s*<\/button>/g,
  `<button className={\`tab-btn \${activeTab === 'benevolat' ? 'active' : ''}\`} onClick={() => { setActiveTab('benevolat'); window.scrollTo(0,0); }}>
          <span className="tab-icon">🤝</span>
          <span>Bénévolat</span>
        </button>
        <button className={\`tab-btn \${activeTab === 'documents' ? 'active' : ''}\`} onClick={() => { setActiveTab('documents'); window.scrollTo(0,0); }}>
          <span className="tab-icon">📁</span>
          <span>Documents</span>
        </button>`
);

// Bottom nav
content = content.replace(
  /<a onClick=\{\(\) => \{\s*setActiveTab\('droits'\);\s*window\.scrollTo\(0,0\);\s*\}\} className=\{activeTab === 'droits' \? 'active' : ''\}>\n\s*<span className="nav-icon">🗳️<\/span>\n\s*<span>Vote<\/span>\n\s*<\/a>/g,
  `<a onClick={() => { setActiveTab('benevolat'); window.scrollTo(0,0); }} className={activeTab === 'benevolat' ? 'active' : ''}>
          <span className="nav-icon">🤝</span>
          <span>Bénévolat</span>
        </a>
        <a onClick={() => { setActiveTab('droits'); window.scrollTo(0,0); }} className={activeTab === 'droits' ? 'active' : ''}>
          <span className="nav-icon">🗳️</span>
          <span>Vote</span>
        </a>`
);

fs.writeFileSync(path, content);
