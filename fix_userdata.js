import fs from 'fs';

const dashboards = [
  'VicePresidentDashboard.tsx',
  'SecretaireDashboard.tsx',
  'TresorierDashboard.tsx',
  'ConseillerDashboard.tsx'
];

dashboards.forEach(file => {
  let path = 'src/pages/dashboard/' + file;
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');

    // Make sure useAuth is imported
    if (!content.includes('import { useAuth }')) {
      content = content.replace(
        /import \{ useNavigate \} from 'react-router-dom';/,
        `import { useNavigate } from 'react-router-dom';\nimport { useAuth } from '../../context/AuthContext';`
      );
    }

    // Insert const { userData } = useAuth(); if missing
    if (!content.includes('const { userData } = useAuth();')) {
      content = content.replace(
        /const navigate = useNavigate\(\);/,
        `const navigate = useNavigate();\n  const { userData } = useAuth();`
      );
    }

    fs.writeFileSync(path, content);
  }
});
