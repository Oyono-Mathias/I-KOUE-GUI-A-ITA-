import fs from 'fs';

const dashboards = [
  'PresidentDashboard.tsx',
  'VicePresidentDashboard.tsx',
  'SecretaireDashboard.tsx',
  'TresorierDashboard.tsx',
  'ConseillerDashboard.tsx',
  'MemberDashboard.tsx'
];

dashboards.forEach(file => {
  let path = 'src/pages/dashboard/' + file;
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Remove member-info-bar
    content = content.replace(/<div className="member-info-bar">[\s\S]*?<\/div>\s*<\/header>/, '</header>');

    // 2. Fix the welcome messages
    // President
    content = content.replace(/<h2>Bienvenue, Mr le Président<\/h2>/, `<h2>Bienvenue, Mr le Président {userData?.nom || userData?.displayName || ''}</h2>`);
    
    // Vice-President
    content = content.replace(/<h2>Bienvenue, Mr le Vice-Président <\/h2>/, `<h2>Bienvenue, Mr le Vice-Président {userData?.nom || userData?.displayName || ''}</h2>`);
    content = content.replace(/<h2>Bienvenue, Mr le Vice-Président<\/h2>/, `<h2>Bienvenue, Mr le Vice-Président {userData?.nom || userData?.displayName || ''}</h2>`);
    
    // Secretaire
    content = content.replace(/<h2>Bienvenue, Mr le Secrétaire<\/h2>/, `<h2>Bienvenue, Mr le Secrétaire {userData?.nom || userData?.displayName || ''}</h2>`);
    
    // Tresorier
    content = content.replace(/<h2>Bienvenue, Mr le Trésorier<\/h2>/, `<h2>Bienvenue, Mr le Trésorier {userData?.nom || userData?.displayName || ''}</h2>`);
    
    // Conseiller
    content = content.replace(/<h2>Bienvenue, Mr le Conseiller<\/h2>/, `<h2>Bienvenue, Mr le Conseiller {userData?.nom || userData?.displayName || ''}</h2>`);

    fs.writeFileSync(path, content);
  }
});
