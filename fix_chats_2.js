import fs from 'fs';

const files = [
  'src/pages/dashboard/VicePresidentDashboard.tsx',
  'src/pages/dashboard/SecretaireDashboard.tsx',
  'src/pages/dashboard/TresorierDashboard.tsx',
  'src/pages/communication/CommunicateurDashboard.tsx'
];

files.forEach((path) => {
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/\$\{\$\{activeTabStr\}\ \?\ 'active'\ :\ ''\}/g, `\${activeTab === 'messages' ? 'active' : ''}`);
  content = content.replace(/\$\{\$\{activeTabStr\}\ \?\ 'active'\ :\ ''\}/g, `\${activeTab === 'board_messages' ? 'active' : ''}`); 
  // Wait, I can just replace activeTabStr with the actual string based on the file.
  
  if (path.includes('Communicateur')) {
    content = content.replace(/\$\{activeTab \=\=\= 'messages' \?\ 'active' : ''\}/g, `\${activeTab === 'board_messages' ? 'active' : ''}`);
  }
  
  // Actually, let's just do a manual replace
  if(content.includes('${activeTabStr}')) {
    if (path.includes('Communicateur')) {
      content = content.replace(/\$\{\$\{activeTabStr\}\ \?\ 'active'\ :\ ''\}/g, `\${activeTab === 'board_messages' ? 'active' : ''}`);
    } else {
      content = content.replace(/\$\{\$\{activeTabStr\}\ \?\ 'active'\ :\ ''\}/g, `\${activeTab === 'messages' ? 'active' : ''}`);
    }
  }

  fs.writeFileSync(path, content);
  console.log(`Fixed ${path}`);
});
