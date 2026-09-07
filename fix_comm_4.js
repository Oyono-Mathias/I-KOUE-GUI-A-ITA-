import fs from 'fs';
let commPath = 'src/pages/communication/CommunicateurDashboard.tsx';
if (fs.existsSync(commPath)) {
  let content = fs.readFileSync(commPath, 'utf8');
  content = content.replace(/name: file\.name,\n\s+type: file\.type\.startsWith\('image\/'\) \? 'image' : 'document',\n\s+size: file\.size,/g, 
  `name: (file as File).name,\n            type: (file as File).type.startsWith('image/') ? 'image' : 'document',\n            size: (file as File).size,`);
  fs.writeFileSync(commPath, content);
}
