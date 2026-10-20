import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

const projectId = 'demo-ikoue-rules';
const pollId = 'poll-1';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

after(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'member-ok'), {
      role: 'membre',
      statut: 'a_jour',
    });
    await setDoc(doc(db, 'users', 'member-late'), {
      role: 'membre',
      statut: 'en_attente',
    });
    await setDoc(doc(db, 'users', 'member-suspended'), {
      role: 'membre',
      statut: 'suspendu',
    });
    await setDoc(doc(db, 'ag_events', pollId), {
      status: 'ouvert_au_vote',
    });
    await setDoc(doc(db, 'ag_events', 'poll-closed'), {
      status: 'termine',
    });
  });
});

function memberDb(uid = 'member-ok') {
  return testEnv.authenticatedContext(uid).firestore();
}

async function castVote(uid = 'member-ok', id = `${pollId}_${uid}`, targetPollId = pollId) {
  const db = memberDb(uid);
  return setDoc(doc(db, 'votes', id), {
    pollId: targetPollId,
    choice: 'pour',
    memberId: uid,
    timestamp: serverTimestamp(),
  });
}

describe('règles Firestore des votes', () => {
  it('autorise un vote valide pour un membre à jour et un scrutin ouvert', async () => {
    await assertSucceeds(castVote());
  });

  it('refuse un vote si la cotisation est en attente', async () => {
    await assertFails(castVote('member-late'));
  });

  it('refuse un vote d’un compte suspendu', async () => {
    await assertFails(castVote('member-suspended'));
  });

  it('refuse un vote sur un scrutin fermé', async () => {
    await assertFails(castVote('member-ok', 'poll-closed_member-ok', 'poll-closed'));
  });

  it('refuse un identifiant qui ne correspond pas au scrutin et au membre', async () => {
    await assertFails(castVote('member-ok', 'poll-1_someone-else'));
  });

  it('refuse une usurpation de memberId', async () => {
    const db = memberDb();
    await assertFails(setDoc(doc(db, 'votes', `${pollId}_member-ok`), {
      pollId,
      choice: 'pour',
      memberId: 'another-user',
      timestamp: serverTimestamp(),
    }));
  });

  it('refuse un second vote sur le même scrutin', async () => {
    await assertSucceeds(castVote());
    await assertFails(castVote());
  });

  it('refuse la modification et la suppression d’un vote existant', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'votes', `${pollId}_member-ok`), {
        pollId,
        choice: 'pour',
        memberId: 'member-ok',
        timestamp: new Date(),
      });
    });
    const db = memberDb();
    await assertFails(setDoc(doc(db, 'votes', `${pollId}_member-ok`), {
      pollId,
      choice: 'contre',
      memberId: 'member-ok',
      timestamp: serverTimestamp(),
    }));
    await assertFails(deleteDoc(doc(db, 'votes', `${pollId}_member-ok`)));
  });

  it('autorise la vérification du vote propre mais refuse la lecture du vote d’un autre membre', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'votes', `${pollId}_another-member`), {
        pollId,
        choice: 'pour',
        memberId: 'another-member',
        timestamp: new Date(),
      });
    });
    const db = memberDb();
    await assertSucceeds(getDoc(doc(db, 'votes', `${pollId}_member-ok`)));
    await assertFails(getDoc(doc(db, 'votes', `${pollId}_another-member`)));
  });

  it('refuse aux membres de lister les votes', async () => {
    await assertFails(getDocs(query(collection(memberDb(), 'votes'))));
  });
});
