import fs from 'fs';
let path = 'src/pages/dashboard/MemberDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Top nav
content = content.replace(
  /<button className=\{\`tab-btn \$\{\s*activeTab === 'documents'\s*\?\s*'active'\s*:\s*''\s*\}\`\} onClick=\{\(\) => \{\s*setActiveTab\('documents'\);\s*window\.scrollTo\(0,0\);\s*\}\}>\n\s*<span className="tab-icon">📄<\/span>\n\s*<span>Documents<\/span>\n\s*<\/button>/g,
  `<button className={\`tab-btn \${activeTab === 'benevolat' ? 'active' : ''}\`} onClick={() => { setActiveTab('benevolat'); window.scrollTo(0,0); }}>
          <span className="tab-icon">🤝</span>
          <span>Bénévolat</span>
        </button>
        <button className={\`tab-btn \${activeTab === 'documents' ? 'active' : ''}\`} onClick={() => { setActiveTab('documents'); window.scrollTo(0,0); }}>
          <span className="tab-icon">📄</span>
          <span>Documents</span>
        </button>`
);

fs.writeFileSync(path, content);
