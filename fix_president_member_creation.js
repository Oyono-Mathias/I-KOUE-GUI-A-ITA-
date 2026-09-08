import fs from 'fs';

let pPath = 'src/pages/dashboard/PresidentDashboard.tsx';
let pContent = fs.readFileSync(pPath, 'utf8');

// 1. Add imports
pContent = pContent.replace(
  /import \{ signOut \} from 'firebase\/auth';/,
  `import { signOut, createUserWithEmailAndPassword } from 'firebase/auth';`
);

pContent = pContent.replace(
  /import \{ db, auth \} from '\.\.\/\.\.\/firebase';/,
  `import { db, auth, secondaryAuth } from '../../firebase';`
);

// 2. Modify the form submit logic
const submitLogicOld = `const nom = (document.getElementById('newMemNom') as HTMLInputElement).value;
                    const email = (document.getElementById('newMemEmail') as HTMLInputElement).value;
                    const tel = (document.getElementById('newMemTel') as HTMLInputElement).value;
                    const role = (document.getElementById('newMemRole') as HTMLSelectElement).value;
                    const cat = (document.getElementById('newMemCat') as HTMLSelectElement).value;
                    
                    if(nom) {
                        await addDoc(collection(db, 'users'), {
                            nom, email, telephone: tel, role, categorie: cat, statut: 'actif', createdAt: serverTimestamp()
                        });
                        setAddMemberModalOpen(false);
                    }`;

const submitLogicNew = `const nom = (document.getElementById('newMemNom') as HTMLInputElement).value;
                    const email = (document.getElementById('newMemEmail') as HTMLInputElement).value;
                    const password = (document.getElementById('newMemPwd') as HTMLInputElement).value;
                    const tel = (document.getElementById('newMemTel') as HTMLInputElement).value;
                    const role = (document.getElementById('newMemRole') as HTMLSelectElement).value;
                    const cat = (document.getElementById('newMemCat') as HTMLSelectElement).value;
                    
                    if(nom && email && password) {
                        try {
                            // Create user in Firebase Auth without logging out current admin
                            const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
                            
                            // Save to Firestore with the same UID
                            await setDoc(doc(db, 'users', userCred.user.uid), {
                                nom, email, telephone: tel, role, categorie: cat, statut: 'actif', createdAt: serverTimestamp()
                            });
                            setAddMemberModalOpen(false);
                        } catch(err: any) {
                            alert("Erreur lors de la création du compte : " + err.message);
                        }
                    }`;

pContent = pContent.replace(submitLogicOld, submitLogicNew);

// 3. Add the password field
const emailField = `<div className="form-group"><label>Email</label><input type="email" id="newMemEmail" style={{ width: '100%', padding: '8px' }} /></div>`;
const emailAndPwdFields = `<div className="form-group"><label>Email</label><input type="email" id="newMemEmail" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Mot de passe</label><input type="password" id="newMemPwd" required style={{ width: '100%', padding: '8px' }} minLength={6} /></div>`;

pContent = pContent.replace(emailField, emailAndPwdFields);

fs.writeFileSync(pPath, pContent);
