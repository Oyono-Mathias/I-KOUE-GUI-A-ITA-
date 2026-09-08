import fs from 'fs';

let presPath = 'src/pages/dashboard/PresidentDashboard.tsx';
let pContent = fs.readFileSync(presPath, 'utf8');

// 1. Add state for the Add Member Modal
if (!pContent.includes('const [addMemberModalOpen')) {
  pContent = pContent.replace(
    /const \[memberModal, setMemberModal\] = useState<any>\(null\);/,
    `const [memberModal, setMemberModal] = useState<any>(null);\n  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);`
  );

  // 2. Add the button next to the search input or in the section header
  pContent = pContent.replace(
    /<div className="section-header">\n\s*<h2>👥 Gestion des Membres<\/h2>\n\s*<p>\{members\.length\} membre\(s\) au total<\/p>\n\s*<\/div>/,
    `<div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h2>👥 Gestion des Membres</h2>
                <p>{members.length} membre(s) au total</p>
            </div>
            <button className="btn btn-primary" onClick={() => setAddMemberModalOpen(true)}>+ Nouveau membre</button>
        </div>`
  );

  // 3. Add the form logic
  const addMemberHtml = `
    {addMemberModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Ajouter un nouveau membre</h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const nom = (document.getElementById('newMemNom') as HTMLInputElement).value;
                    const email = (document.getElementById('newMemEmail') as HTMLInputElement).value;
                    const tel = (document.getElementById('newMemTel') as HTMLInputElement).value;
                    const role = (document.getElementById('newMemRole') as HTMLSelectElement).value;
                    const cat = (document.getElementById('newMemCat') as HTMLSelectElement).value;
                    
                    if(nom) {
                        await addDoc(collection(db, 'users'), {
                            nom, email, telephone: tel, role, categorie: cat, statut: 'actif', createdAt: serverTimestamp()
                        });
                        setAddMemberModalOpen(false);
                    }
                }}>
                    <div className="form-group"><label>Nom complet</label><input type="text" id="newMemNom" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Email</label><input type="email" id="newMemEmail" style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Téléphone</label><input type="text" id="newMemTel" style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Rôle</label>
                            <select id="newMemRole" style={{ width: '100%', padding: '8px' }}>
                                <option value="member">Membre standard</option>
                                <option value="president">Président</option>
                                <option value="vice_president">Vice-Président</option>
                                <option value="secretaire">Secrétaire Général</option>
                                <option value="tresorier">Trésorier</option>
                                <option value="communicateur">Communicateur</option>
                                <option value="conseiller">Conseiller</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Catégorie</label>
                            <select id="newMemCat" style={{ width: '100%', padding: '8px' }}>
                                <option value="actif">Actif</option>
                                <option value="bienfaiteur">Bienfaiteur</option>
                                <option value="fondateur">Fondateur</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" className="btn btn-primary">Créer le compte</button>
                        <button type="button" className="btn btn-outline" onClick={() => setAddMemberModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )}
`;

  pContent = pContent.replace(
    /\{memberModal && \(/,
    addMemberHtml + '\n    {memberModal && ('
  );

  fs.writeFileSync(presPath, pContent);
}

