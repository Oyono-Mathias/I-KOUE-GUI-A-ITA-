import fs from 'fs';
let dashPath = 'src/pages/Dashboard.tsx';
if (fs.existsSync(dashPath)) {
  let content = fs.readFileSync(dashPath, 'utf8');
  content = content.replace(/\(window as any\)\.showPage =/g, "(window as any).showPage ="); // Already replaced but still errors? Let's check.
  fs.writeFileSync(dashPath, content);
}
