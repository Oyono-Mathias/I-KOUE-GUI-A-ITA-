import fs from 'fs';

const tsConfig = [
  'src/pages/dashboard/PresidentDashboard.tsx',
  'src/pages/dashboard/SecretaireDashboard.tsx',
  'src/pages/dashboard/TresorierDashboard.tsx',
  'src/pages/dashboard/VicePresidentDashboard.tsx',
  'src/pages/communication/CommunicateurDashboard.tsx'
];

tsConfig.forEach(path => {
  if (!fs.existsSync(path)) return;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/const input = document\.getElementById\('([^']+)'\);/g, "const input = document.getElementById('$1') as HTMLTextAreaElement;");
  content = content.replace(/const input = document\.getElementById\('([^']+)'\) as HTMLInputElement;/g, "const input = document.getElementById('$1') as HTMLTextAreaElement;");
  
  // also for generic inputs from form submissions:
  content = content.replace(/const ([a-zA-Z0-9_]+) = \(document\.getElementById\('([^']+)'\)\)\.value;/g, "const $1 = (document.getElementById('$2') as HTMLInputElement).value;");
  
  fs.writeFileSync(path, content);
  console.log('Fixed types in ' + path);
});

// Specifically for CommunicateurDashboard.tsx state issues
let commPath = 'src/pages/communication/CommunicateurDashboard.tsx';
if (fs.existsSync(commPath)) {
  let content = fs.readFileSync(commPath, 'utf8');
  if (!content.includes('const [boardMessages, setBoardMessages] = useState<any[]>([]);')) {
     content = content.replace('const [messages, setMessages] = useState<any[]>([]);', 
      `const [messages, setMessages] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [editorialCalendar, setEditorialCalendar] = useState<any[]>([]);`);
  }
  
  // Fix the unknown file type
  content = content.replace(/const file = e\.target\.files\[0\];/g, "const file = (e.target as HTMLInputElement).files?.[0];");
  content = content.replace(/if \(file\) \{\n\s+const fileData = \{/g, `if (file) {
                const fileData = {`);
  content = content.replace(/name: file\.name,\n\s+type: file\.type,\n\s+size: file\.size,/g, `name: (file as File).name,
                    type: (file as File).type,
                    size: (file as File).size,`);
  content = content.replace(/uploadBytes\(storageRef, file\)/g, `uploadBytes(storageRef, file as File)`);
  
  fs.writeFileSync(commPath, content);
}

// Fix Footer Facebook
let footerPath = 'src/components/layout/Footer.tsx';
if (fs.existsSync(footerPath)) {
  let content = fs.readFileSync(footerPath, 'utf8');
  content = content.replace(/import \{ Facebook, /g, "import { ");
  content = content.replace(/<Facebook className="social-icon" \/>/g, `<svg className="social-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`);
  fs.writeFileSync(footerPath, content);
}

// Fix Dashboard.tsx showPage
let dashPath = 'src/pages/Dashboard.tsx';
if (fs.existsSync(dashPath)) {
  let content = fs.readFileSync(dashPath, 'utf8');
  content = content.replace(/window\.showPage = /g, "(window as any).showPage = ");
  fs.writeFileSync(dashPath, content);
}

// Fix LandingPage.tsx status
let landingPath = 'src/pages/public/LandingPage.tsx';
if (fs.existsSync(landingPath)) {
  let content = fs.readFileSync(landingPath, 'utf8');
  content = content.replace(/filter\(\(n: any\) => n\.status === 'publie'\)/g, "filter((n: any) => n.status === 'publie')");
  // wait, the error is: Property 'status' does not exist on type '{ id: string; }'.
  content = content.replace(/snap\.docs\.map\(d => \(\{ id: d\.id, \.\.\.d\.data\(\) \}\)\)\.filter\(n => n\.status === 'publie'\)/g, 
    "snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter((n: any) => n.status === 'publie')");
  fs.writeFileSync(landingPath, content);
}
