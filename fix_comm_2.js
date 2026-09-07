import fs from 'fs';
let commPath = 'src/pages/communication/CommunicateurDashboard.tsx';
if (fs.existsSync(commPath)) {
  let content = fs.readFileSync(commPath, 'utf8');
  content = content.replace(/const file = e\.target\.files\?\.\[0\];/g, "const file = (e.target as HTMLInputElement).files?.[0];");
  content = content.replace(/if \(file\) \{\n\s+const fileData = \{/g, `if (file) {
                const fileData = {`);
  content = content.replace(/uploadBytes\(storageRef, file\)/g, `uploadBytes(storageRef, file as any)`);
  fs.writeFileSync(commPath, content);
}
