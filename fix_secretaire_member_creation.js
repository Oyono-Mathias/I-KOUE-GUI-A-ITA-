import fs from 'fs';

let sPath = 'src/pages/dashboard/SecretaireDashboard.tsx';
let sContent = fs.readFileSync(sPath, 'utf8');

// 1. Add imports
sContent = sContent.replace(
  /import \{ signOut \} from 'firebase\/auth';/,
  `import { signOut, createUserWithEmailAndPassword } from 'firebase/auth';`
);

sContent = sContent.replace(
  /import \{ db, auth, storage \} from '\.\.\/\.\.\/lib\/firebase';/,
  `import { db, auth, storage, secondaryAuth } from '../../lib/firebase';`
);

// 2. Modify the form submit logic
const submitLogicOldSec = `const nom = (document.getElementById('secNewMemNom') as HTMLInputElement).value;
                    const email = (document.getElementById('secNewMemEmail') as HTMLInputElement).value;
                    const tel = (document.getElementById('secNewMemTel') as HTMLInputElement).value;
                    const role = (document.getElementById('secNewMemRole') as HTMLSelectElement).value;
                    const cat = (document.getElementById('secNewMemCat') as HTMLSelectElement).value;
                    
                    if(nom) {
                        await addDoc(collection(db, 'users'), {
                            nom, email, telephone: tel, role, categorie: cat, statut: 'actif', createdAt: serverTimestamp()
                        });
                        setAddMemberModalOpen(false);
                    }`;

const submitLogicNewSec = `const nom = (document.getElementById('secNewMemNom') as HTMLInputElement).value;
                    const email = (document.getElementById('secNewMemEmail') as HTMLInputElement).value;
                    const password = (document.getElementById('secNewMemPwd') as HTMLInputElement).value;
                    const tel = (document.getElementById('secNewMemTel') as HTMLInputElement).value;
                    const role = (document.getElementById('secNewMemRole') as HTMLSelectElement).value;
                    const cat = (document.getElementById('secNewMemCat') as HTMLSelectElement).value;
                    
                    if(nom && email && password) {
                        try {
                            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                            await setDoc(doc(db, 'users', userCred.user.uid), {
                                nom, email, telephone: tel, role, categorie: cat, statut: 'actif', createdAt: serverTimestamp()
                            });
                            setAddMemberModalOpen(false);
                        } catch(err: any) {
                            alert("Erreur lors de la création du compte : " + err.message);
                        }
                    }`;

sContent = sContent.replace(submitLogicOldSec, submitLogicNewSec);

// 3. Add the password field
const emailFieldSec = `<div className="form-group"><label>Email</label><input type="email" id="secNewMemEmail" style={{ width: '100%', padding: '8px' }} /></div>`;
const emailAndPwdFieldsSec = `<div className="form-group"><label>Email</label><input type="email" id="secNewMemEmail" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Mot de passe</label><input type="password" id="secNewMemPwd" required style={{ width: '100%', padding: '8px' }} minLength={6} /></div>`;

sContent = sContent.replace(emailFieldSec, emailAndPwdFieldsSec);

fs.writeFileSync(sPath, sContent);
