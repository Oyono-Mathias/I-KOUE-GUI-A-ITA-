import fs from 'fs';
let memberPath = 'src/pages/dashboard/MemberDashboard.tsx';
if (fs.existsSync(memberPath)) {
  let content = fs.readFileSync(memberPath, 'utf8');
  content = content.replace(/const msg = \(document\.getElementById\('forumMsg'\)\)\.value;/g, "const msg = (document.getElementById('forumMsg') as HTMLTextAreaElement).value;");
  fs.writeFileSync(memberPath, content);
}
