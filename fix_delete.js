import fs from 'fs';

let pPath = 'src/pages/dashboard/PresidentDashboard.tsx';
let pContent = fs.readFileSync(pPath, 'utf8');

if (!pContent.includes('const deleteMember =')) {
  // Add delete function
  pContent = pContent.replace(
    /const suspendMember = \(id: string\) => \{/,
    `const deleteMember = (id: string) => {
      confirmAction('🗑️ Êtes-vous sûr de vouloir supprimer définitivement ce compte ?', async () => {
        await deleteDoc(doc(db, 'users', id));
        await logDecision('SUPPRESSION_MEMBRE', \`Membre \${id} supprimé\`);
      });
  };

  const suspendMember = (id: string) => {`
  );

  // Add delete button
  pContent = pContent.replace(
    /<select className="search-input"/,
    `<button className="btn btn-danger btn-small" style={{ background: '#EF4444', color: 'white', padding: '2px 8px', border: 'none' }} onClick={() => deleteMember(m.id)}>🗑️ Supprimer</button>
                                  <select className="search-input"`
  );

  fs.writeFileSync(pPath, pContent);
}

let sPath = 'src/pages/dashboard/SecretaireDashboard.tsx';
let sContent = fs.readFileSync(sPath, 'utf8');

if (!sContent.includes('const deleteMember =')) {
  // Add delete function to Secretaire if they have confirmAction
  // Actually Secretaire doesn't have confirmAction for members usually, let's just use window.confirm
  sContent = sContent.replace(
    /const setMemberModalOpen =.*?;\n/g,
    `const setMemberModalOpen = (m: any) => { /* already exists in state */ };
  const deleteMember = async (id: string) => {
    if (window.confirm('🗑️ Êtes-vous sûr de vouloir supprimer définitivement ce compte ?')) {
      await deleteDoc(doc(db, 'users', id));
    }
  };\n`
  );

  sContent = sContent.replace(
    /<button className="btn btn-outline btn-small" onClick=\{\(\) => setMemberModalOpen\(m\)\}>👁️ Voir<\/button>/,
    `<button className="btn btn-outline btn-small" onClick={() => setMemberModalOpen(m)}>👁️ Voir</button>
                          <button className="btn btn-danger btn-small" style={{ background: '#EF4444', color: 'white', padding: '2px 8px', border: 'none' }} onClick={() => deleteMember(m.id)}>🗑️ Supprimer</button>`
  );

  fs.writeFileSync(sPath, sContent);
}
