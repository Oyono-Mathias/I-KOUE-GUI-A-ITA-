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

    // Add useSearchParams import if missing
    if (!content.includes('useSearchParams')) {
      content = content.replace(
        /import \{ useNavigate \} from 'react-router-dom';/,
        `import { useNavigate, useSearchParams } from 'react-router-dom';`
      );
    }

    // Replace useState('dashboard') with useSearchParams()
    content = content.replace(
      /const \[activeTab, setActiveTab\] = useState\('dashboard'\);/,
      `const [searchParams, setSearchParams] = useSearchParams();\n  const activeTab = searchParams.get('tab') || 'dashboard';\n  const setActiveTab = (tab: string) => setSearchParams({ tab });`
    );

    fs.writeFileSync(path, content);
  }
});
