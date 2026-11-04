import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'demo-i-koue-gui-a-ita';
const DATABASE_ID = process.env.FIREBASE_DATABASE_ID || 'ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5';
const EMULATOR_HOST = '127.0.0.1';
const EMULATOR_PORT = 8080;
const RULES_PATH = resolve(__dirname, '../firestore.rules');

let testEnv;

before(async () => {
  const rules = await readFile(RULES_PATH, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: EMULATOR_HOST,
      port: EMULATOR_PORT,
      rules,
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  const response = await fetch(
    `http://${EMULATOR_HOST}:${EMULATOR_PORT}/emulator/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`,
    { method: 'DELETE' },
  );
  assert.equal(response.ok, true, 'Unable to clear the named Firestore emulator database');
});

function namedDbForContext(context, mockUserToken) {
  // Reuse the isolated test app, select the production database ID, and pass
  // the same emulator-only mock token explicitly to this named Firestore client.
  const contextFirestore = context.firestore();
  const db = getFirestore(contextFirestore.app, DATABASE_ID);
  connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORT, { mockUserToken });
  return db;
}

function dbFor(uid) {
  const context = testEnv.authenticatedContext(uid);
  return namedDbForContext(context, { sub: uid, user_id: uid });
}

async function seedUser(uid, role, extra = {}) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(namedDbForContext(context, 'owner'), 'users', uid), {
      role,
      statut: 'actif',
      ...extra,
    });
  });
}

async function seedDocument(path, id, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(namedDbForContext(context, 'owner'), path, id), data);
  });
}

test('Commissaire aux Comptes: lecture financière autorisée, écriture refusée', async () => {
  await seedUser('auditor-1', 'commissaire_aux_comptes');
  await seedDocument('expenses', 'expense-1', { montant: 25000, description: 'Test' });

  const db = dbFor('auditor-1');
  await assertSucceeds(getDoc(doc(db, 'expenses', 'expense-1')));
  await assertFails(setDoc(doc(db, 'expenses', 'expense-2'), { montant: 1000 }));
});

test('Trésorier adjoint: lecture seule sur les revenus', async () => {
  await seedUser('assistant-treasurer', 'tresorier_adjoint');
  await seedDocument('income', 'income-1', { montant: 50000 });

  const db = dbFor('assistant-treasurer');
  await assertSucceeds(getDoc(doc(db, 'income', 'income-1')));
  await assertFails(updateDoc(doc(db, 'income', 'income-1'), { montant: 60000 }));
});

test('Président: aucun héritage des accès financiers du Trésorier', async () => {
  await seedUser('president-1', 'president');
  await seedDocument('finances', 'finance-1', { montant: 75000, memberId: 'member-1' });
  await seedDocument('expenses', 'expense-1', { montant: 10000 });

  const db = dbFor('president-1');
  await assertFails(getDoc(doc(db, 'finances', 'finance-1')));
  await assertFails(getDoc(doc(db, 'expenses', 'expense-1')));
});

test('Membre: lecture limitée à ses propres documents financiers', async () => {
  await seedUser('member-1', 'membre');
  await seedDocument('finances', 'own-payment', {
    memberId: 'member-1',
    type: 'cotisation_demande',
    montant: 5000,
  });
  await seedDocument('finances', 'other-payment', {
    memberId: 'member-2',
    type: 'cotisation_demande',
    montant: 5000,
  });

  const db = dbFor('member-1');
  await assertSucceeds(getDoc(doc(db, 'finances', 'own-payment')));
  await assertFails(getDoc(doc(db, 'finances', 'other-payment')));
});

test('Membre: création d’une demande de cotisation en attente uniquement', async () => {
  await seedUser('member-1', 'membre');
  const db = dbFor('member-1');

  await assertSucceeds(setDoc(doc(db, 'finances', 'valid-request'), {
    type: 'cotisation_demande',
    category: 'cotisation',
    memberId: 'member-1',
    memberName: 'Membre de test',
    montant: 5000,
    period: '2026-11',
    payment: 'orange_money',
    reference: 'TEST-REF-001',
    status: 'en_attente',
    createdAt: serverTimestamp(),
  }));

  await assertFails(setDoc(doc(db, 'finances', 'forged-request'), {
    type: 'cotisation_demande',
    category: 'cotisation',
    memberId: 'member-1',
    memberName: 'Membre de test',
    montant: -5000,
    period: '2026-11',
    payment: 'orange_money',
    reference: 'TEST-REF-002',
    status: 'valide',
    createdAt: serverTimestamp(),
  }));
});

test('Seul le Trésorier valide une demande sans altérer les données initiales', async () => {
  await seedUser('treasurer-1', 'tresorier');
  await seedUser('assistant-1', 'tresorier_adjoint');
  await seedDocument('finances', 'pending-1', {
    type: 'cotisation_demande',
    category: 'cotisation',
    memberId: 'member-1',
    memberName: 'Membre de test',
    montant: 5000,
    period: '2026-11',
    payment: 'orange_money',
    reference: 'TEST-REF-003',
    status: 'en_attente',
  });

  const assistantDb = dbFor('assistant-1');
  await assertFails(updateDoc(doc(assistantDb, 'finances', 'pending-1'), {
    status: 'valide',
    validatedAt: serverTimestamp(),
    validatedBy: 'assistant-1',
    validatedByName: 'Trésorier adjoint',
    receiptNumber: 'REC-TEST-001',
  }));

  const treasurerDb = dbFor('treasurer-1');
  await assertSucceeds(updateDoc(doc(treasurerDb, 'finances', 'pending-1'), {
    status: 'valide',
    validatedAt: serverTimestamp(),
    validatedBy: 'treasurer-1',
    validatedByName: 'Trésorier',
    receiptNumber: 'REC-TEST-002',
  }));

  await assertFails(updateDoc(doc(treasurerDb, 'finances', 'pending-1'), {
    montant: 999999,
  }));
});

test('Les tâches restent limitées au rôle affecté', async () => {
  await seedUser('advisor-1', 'conseiller');
  await seedDocument('tasks', 'advisor-task', {
    title: 'Tâche conseiller',
    description: 'Test',
    assignedTo: 'conseiller',
    completed: false,
  });
  await seedDocument('tasks', 'treasurer-task', {
    title: 'Tâche trésorier',
    description: 'Test',
    assignedTo: 'tresorier',
    completed: false,
  });

  const db = dbFor('advisor-1');
  await assertSucceeds(getDoc(doc(db, 'tasks', 'advisor-task')));
  await assertFails(getDoc(doc(db, 'tasks', 'treasurer-task')));
  await assertFails(updateDoc(doc(db, 'tasks', 'advisor-task'), {
    title: 'Modification non autorisée',
  }));
});

test('Un membre affecté ne peut modifier que le statut d’exécution de sa tâche', async () => {
  await seedUser('member-1', 'membre');
  await seedDocument('tasks', 'member-task', {
    title: 'Tâche membre',
    description: 'Test',
    assignedTo: 'membre',
    completed: false,
    completedAt: null,
  });

  const db = dbFor('member-1');
  await assertSucceeds(updateDoc(doc(db, 'tasks', 'member-task'), {
    completed: true,
    completedAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(db, 'tasks', 'member-task'), {
    title: 'Titre modifié',
  }));
});

test('Président Fondateur: lecture des archives sans écriture', async () => {
  await seedUser('founder-1', 'president_fondateur');
  await seedDocument('documents', 'archive-1', { title: 'Archive de test' });

  const db = dbFor('founder-1');
  await assertSucceeds(getDoc(doc(db, 'documents', 'archive-1')));
  await assertFails(setDoc(doc(db, 'documents', 'archive-2'), { title: 'Écriture interdite' }));
});

test('Un utilisateur ne peut pas s’attribuer un rôle privilégié', async () => {
  await seedUser('member-1', 'membre');
  const db = dbFor('member-1');

  await assertFails(updateDoc(doc(db, 'users', 'member-1'), {
    role: 'tresorier',
  }));
});


test('CMS Landing Page: le document principal est lisible publiquement', async () => {
  await seedDocument('landing_content', 'main', {
    hero: { title: 'Information publique' },
    updatedAt: new Date(),
    updatedBy: 'editor',
  });
  const publicDb = namedDbForContext(testEnv.unauthenticatedContext(), undefined);
  const { getDoc: readDoc } = await import('firebase/firestore');
  await assertSucceeds(readDoc(doc(publicDb, 'landing_content', 'main')));
});


test('CMS Landing Page: les trois rôles éditoriaux peuvent publier le document public', async () => {
  for (const [uid, role] of [
    ['cms-communicator', 'communicateur'],
    ['cms-president', 'president'],
    ['cms-founder', 'president_fondateur'],
  ]) {
    await seedUser(uid, role);
    const db = dbFor(uid);
    await assertSucceeds(setDoc(doc(db, 'landing_content', 'main'), {
      hero: { title: 'Titre de test', subtitle: 'Sous-titre' },
      statistics: [{ label: 'Bénéficiaires', value: '500+' }],
      about: { history: 'Histoire', mission: 'Mission' },
      donation: { title: 'Soutenir', mobileMoney: { orangeMoneyNumber: '+23670000000' } },
      banners: [],
      contact: { address: 'Bangui' },
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    }));
  }
});

test('CMS Landing Page: les autres rôles ne peuvent pas créer le contenu', async () => {
  for (const [uid, role] of [
    ['cms-member', 'membre'],
    ['cms-treasurer', 'tresorier'],
    ['cms-vice-president', 'vice_president'],
  ]) {
    await seedUser(uid, role);
    const db = dbFor(uid);
    await assertFails(setDoc(doc(db, 'landing_content', 'main'), {
      hero: { title: 'Interdit' }, updatedAt: serverTimestamp(), updatedBy: uid,
    }));
  }
});

test('CMS Landing Page: seuls les trois rôles autorisés peuvent modifier le contenu', async () => {
  await seedDocument('landing_content', 'main', {
    hero: { title: 'Titre initial' }, updatedAt: new Date(), updatedBy: 'seed',
  });
  await seedUser('cms-member-update', 'membre');
  await seedUser('cms-communicator-update', 'communicateur');
  await assertFails(setDoc(doc(dbFor('cms-member-update'), 'landing_content', 'main'), {
    hero: { title: 'Modification interdite' }, updatedAt: serverTimestamp(), updatedBy: 'cms-member-update',
  }));
  await assertSucceeds(setDoc(doc(dbFor('cms-communicator-update'), 'landing_content', 'main'), {
    hero: { title: 'Modification autorisée par le communicateur' }, updatedAt: serverTimestamp(), updatedBy: 'cms-communicator-update',
  }));
  await seedUser('cms-president-update', 'president');
  await assertSucceeds(setDoc(doc(dbFor('cms-president-update'), 'landing_content', 'main'), {
    hero: { title: 'Modification autorisée par le président' }, updatedAt: serverTimestamp(), updatedBy: 'cms-president-update',
  }));
});

test('CMS Landing Page: document main uniquement et suppression interdite', async () => {
  await seedUser('cms-editor-delete', 'communicateur');
  const db = dbFor('cms-editor-delete');
  await assertFails(setDoc(doc(db, 'landing_content', 'draft'), {
    hero: { title: 'Autre document' }, updatedAt: serverTimestamp(), updatedBy: 'cms-editor-delete',
  }));
  await seedDocument('landing_content', 'main', { hero: { title: 'Test' } });
  const { deleteDoc } = await import('firebase/firestore');
  await assertFails(deleteDoc(doc(db, 'landing_content', 'main')));
});


test('Président: peut modifier uniquement le rôle institutionnel d’un autre membre', async () => {
  await seedUser('president-role-manager', 'president');
  await seedUser('target-member', 'membre');
  const db = dbFor('president-role-manager');

  await assertSucceeds(updateDoc(doc(db, 'users', 'target-member'), { role: 'tresorier' }));
  await assertFails(updateDoc(doc(db, 'users', 'target-member'), { role: 'admin' }));
  await assertFails(updateDoc(doc(db, 'users', 'target-member'), { role: 'super_admin' }));
  await assertFails(updateDoc(doc(db, 'users', 'target-member'), { role: 'tresorier', statut: 'suspendu' }));
  await assertFails(updateDoc(doc(db, 'users', 'president-role-manager'), { role: 'membre' }));
});

test('Président Fondateur et autres rôles institutionnels: ne peuvent pas attribuer les rôles', async () => {
  await seedUser('founder-role-manager', 'president_fondateur');
  await seedUser('ordinary-member', 'membre');
  await seedUser('treasurer-role-manager', 'tresorier');
  await seedUser('role-target', 'membre');

  await assertFails(updateDoc(doc(dbFor('founder-role-manager'), 'users', 'role-target'), { role: 'president' }));
  await assertFails(updateDoc(doc(dbFor('treasurer-role-manager'), 'users', 'role-target'), { role: 'communicateur' }));
});


test('Visiteur anonyme : peut aimer une actualité et déposer un commentaire en attente', async () => {
  const db = dbFor('anonymous-visitor');
  await assertSucceeds(setDoc(doc(db, 'news', 'story-1', 'likes', 'anonymous-visitor'), {
    uid: 'anonymous-visitor',
    createdAt: serverTimestamp(),
  }));
  await assertSucceeds(setDoc(doc(db, 'news', 'story-1', 'comments', 'pending-1'), {
    authorUid: 'anonymous-visitor',
    authorName: 'Visiteur',
    text: 'Bravo pour cette initiative.',
    status: 'pending',
    createdAt: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(db, 'news', 'story-1', 'comments', 'pending-1'), {
    status: 'approved',
  }));
});

test('Commentaire en attente : invisible aux autres visiteurs et validable uniquement par le Communicateur', async () => {
  await seedUser('communicator-1', 'communicateur');
  await seedDocument('news', 'story-2', { title: 'Actualité de test', status: 'publie' });
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(namedDbForContext(context, 'owner'), 'news', 'story-2', 'comments', 'pending-2'), {
      authorUid: 'visitor-2',
      authorName: 'Visiteur',
      text: 'Commentaire à modérer.',
      status: 'pending',
      createdAt: new Date(),
    });
  });
  const visitorDb = dbFor('visitor-3');
  await assertFails(getDoc(doc(visitorDb, 'news', 'story-2', 'comments', 'pending-2')));
  const communicatorDb = dbFor('communicator-1');
  await assertSucceeds(updateDoc(doc(communicatorDb, 'news', 'story-2', 'comments', 'pending-2'), {
    status: 'approved',
    moderatedAt: serverTimestamp(),
    moderatedBy: 'communicator-1',
  }));
  await assertSucceeds(getDoc(doc(visitorDb, 'news', 'story-2', 'comments', 'pending-2')));
});

test('Un visiteur ne peut ni modifier ni supprimer le commentaire d’un autre auteur', async () => {
  const db = dbFor('visitor-4');
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(namedDbForContext(context, 'owner'), 'news', 'story-3', 'comments', 'approved-3'), {
      authorUid: 'visitor-5',
      authorName: 'Visiteur',
      text: 'Commentaire public.',
      status: 'approved',
      createdAt: new Date(),
    });
  });
  await assertFails(updateDoc(doc(db, 'news', 'story-3', 'comments', 'approved-3'), { text: 'Texte modifié' }));
});
