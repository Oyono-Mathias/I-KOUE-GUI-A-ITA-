import fs from 'fs';
let dashPath = 'src/pages/Dashboard.tsx';
if (fs.existsSync(dashPath)) {
  let content = fs.readFileSync(dashPath, 'utf8');
  content = content.replace(/window\.showPage/g, "(window as any).showPage"); 
  fs.writeFileSync(dashPath, content);
}
