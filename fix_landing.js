import fs from 'fs';
let landingPath = 'src/pages/public/LandingPage.tsx';
if (fs.existsSync(landingPath)) {
  let content = fs.readFileSync(landingPath, 'utf8');
  content = content.replace(/data = data\.filter\(n => n\.status === 'publie'\);/g, "data = data.filter((n: any) => n.status === 'publie');");
  fs.writeFileSync(landingPath, content);
}
