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

    // Replace the wrong import
    content = content.replace(
      /import \{ useAuth \} from '\.\.\/\.\.\/context\/AuthContext';/,
      `import { useAuth } from '../../hooks/useAuth';`
    );

    fs.writeFileSync(path, content);
  }
});
