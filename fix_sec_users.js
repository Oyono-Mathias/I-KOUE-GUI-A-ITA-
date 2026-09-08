import fs from 'fs';

let secPath = 'src/pages/dashboard/SecretaireDashboard.tsx';
let sContent = fs.readFileSync(secPath, 'utf8');

// 1. Fix collection for members in Secretaire
sContent = sContent.replace(
  /collection\(db, 'members'\)/g,
  `collection(db, 'users')`
);

// 2. Add Add Member Modal to Secretaire Dashboard
if (!sContent.includes('const [addMemberModalOpen')) {
  sContent = sContent.replace(
    /const \[memberModalOpen, setMemberModalOpen\] = useState<any>\(null\);/,
    `const [memberModalOpen, setMemberModalOpen] = useState<any>(null);\n  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);`
  );

  sContent = sContent.replace(
    /<div className="section-header"><h2>👥 Fiches Membres<\/h2><\/div>/,
    `<div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>👥 Fiches Membres</h2>
            <button className="btn btn-primary" onClick={() => setAddMemberModalOpen(true)}>+ Nouveau membre</button>
        </div>`
  );

  const addMemberHtml = `
    {addMemberModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '500px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Ajouter un nouveau membre</h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const nom = (document.getElementById('secNewMemNom') as HTMLInputElement).value;
                    const email = (document.getElementById('secNewMemEmail') as HTMLInputElement).value;
                    const tel = (document.getElementById('secNewMemTel') as HTMLInputElement).value;
                    const role = (document.getElementById('secNewMemRole') as HTMLSelectElement).value;
                    const cat = (document.getElementById('secNewMemCat') as HTMLSelectElement).value;
                    
                    if(nom) {
                        await addDoc(collection(db, 'users'), {
                            nom, email, telephone: tel, role, categorie: cat, statut: 'actif', createdAt: serverTimestamp()
                        });
                        setAddMemberModalOpen(false);
                    }
                }}>
                    <div className="form-group"><label>Nom complet</label><input type="text" id="secNewMemNom" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Email</label><input type="email" id="secNewMemEmail" style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Téléphone</label><input type="text" id="secNewMemTel" style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Rôle</label>
                            <select id="secNewMemRole" style={{ width: '100%', padding: '8px' }}>
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
                            <select id="secNewMemCat" style={{ width: '100%', padding: '8px' }}>
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

  sContent = sContent.replace(
    /\{memberModalOpen && \(/,
    addMemberHtml + '\n    {memberModalOpen && ('
  );

  fs.writeFileSync(secPath, sContent);
}

