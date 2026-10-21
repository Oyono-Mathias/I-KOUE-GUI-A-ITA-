import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { getBytes, ref, uploadBytes } from 'firebase/storage';

const projectId = 'demo-ikoue-rules';
const pollId = 'poll-1';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
    storage: {
      rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8'),
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
    await setDoc(doc(db, 'users', 'communicator'), {
      role: 'communicateur',
      statut: 'actif',
    });
    await setDoc(doc(db, 'documents', 'doc-internal'), { title: 'Document interne' });
    await setDoc(doc(db, 'pv', 'pv-internal'), { title: 'Procès-verbal interne' });
    await setDoc(doc(db, 'tasks', 'task-1'), { title: 'Coordination', completed: false, assignedTo: 'secretaire' });
    await setDoc(doc(db, 'missions_benevolat', 'mission-1'), { title: 'Nettoyage', participants: ['other-member'], status: 'ouverte' });
    await setDoc(doc(db, 'ag_events', pollId), {
      status: 'ouvert_au_vote',
    });
    await setDoc(doc(db, 'ag_events', 'poll-closed'), {
      status: 'termine',
    });
    await uploadBytes(
      ref(context.storage(), 'documents/internal.pdf'),
      new Uint8Array([37, 80, 68, 70]),
      { contentType: 'application/pdf' },
    );
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

describe('règles Firebase Storage', () => {
  it('autorise un membre validé à lire un document officiel', async () => {
    const storage = testEnv.authenticatedContext('member-ok').storage();
    await assertSucceeds(getBytes(ref(storage, 'documents/internal.pdf')));
  });

  it('refuse la lecture des documents officiels à un compte en attente', async () => {
    const storage = testEnv.authenticatedContext('member-late').storage();
    await assertFails(getBytes(ref(storage, 'documents/internal.pdf')));
  });

  it('refuse la lecture des documents officiels à un compte sans profil', async () => {
    const storage = testEnv.authenticatedContext('missing-profile').storage();
    await assertFails(getBytes(ref(storage, 'documents/internal.pdf')));
  });

  it('refuse le dépôt de médias par un membre ordinaire', async () => {
    const storage = testEnv.authenticatedContext('member-ok').storage();
    await assertFails(uploadBytes(
      ref(storage, 'media/member-upload.png'),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/png' },
    ));
  });

  it('autorise le dépôt de médias par le communicateur', async () => {
    const storage = testEnv.authenticatedContext('communicator').storage();
    await assertSucceeds(uploadBytes(
      ref(storage, 'media/official-upload.png'),
      new Uint8Array([1, 2, 3]),
      { contentType: 'image/png' },
    ));
  });
});

describe('auto-inscription et validation des membres', () => {
  it('refuse qu’un utilisateur s’attribue lui-même le statut actif', async () => {
    const db = memberDb('new-user');
    await assertFails(setDoc(doc(db, 'users', 'new-user'), {
      role: 'membre',
      statut: 'actif',
    }));
  });

  it('refuse qu’un utilisateur contourne la validation avec le champ status', async () => {
    const db = memberDb('new-user');
    await assertFails(setDoc(doc(db, 'users', 'new-user'), {
      role: 'membre',
      status: 'actif',
    }));
  });

  it('autorise une auto-inscription en attente de validation', async () => {
    const db = memberDb('new-user');
    await assertSucceeds(setDoc(doc(db, 'users', 'new-user'), {
      role: 'membre',
      statut: 'en_attente',
    }));
  });
});

describe('accès aux données réservées aux membres validés', () => {
  it('autorise un membre actif et à jour à lire les documents internes', async () => {
    const db = memberDb('member-ok');
    await assertSucceeds(getDoc(doc(db, 'documents', 'doc-internal')));
    await assertSucceeds(getDoc(doc(db, 'pv', 'pv-internal')));
  });

  it('refuse les documents internes à un compte en attente de validation', async () => {
    const db = memberDb('member-late');
    await assertFails(getDoc(doc(db, 'documents', 'doc-internal')));
    await assertFails(getDoc(doc(db, 'pv', 'pv-internal')));
  });

  it('refuse les documents internes à un compte suspendu', async () => {
    const db = memberDb('member-suspended');
    await assertFails(getDoc(doc(db, 'documents', 'doc-internal')));
    await assertFails(getDoc(doc(db, 'pv', 'pv-internal')));
  });

  it('refuse l’accès à un compte authentifié sans profil Firestore', async () => {
    const db = memberDb('missing-profile');
    await assertFails(getDoc(doc(db, 'documents', 'doc-internal')));
    await assertFails(getDoc(doc(db, 'pv', 'pv-internal')));
    await assertFails(getDoc(doc(db, 'missions_benevolat', 'mission-1')));
  });
});

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


describe('règles Firestore des tâches et missions', () => {
  it('refuse à un membre ordinaire de modifier une tâche', async () => {
    await assertFails(updateDoc(doc(memberDb(), 'tasks', 'task-1'), {
      completed: true,
      completedAt: new Date(),
    }));
  });

  it('autorise un membre du bureau à clôturer une tâche', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'secretary'), {
        role: 'secretaire',
        statut: 'actif',
      });
    });
    const db = testEnv.authenticatedContext('secretary').firestore();
    await assertSucceeds(updateDoc(doc(db, 'tasks', 'task-1'), {
      completed: true,
      completedAt: serverTimestamp(),
    }));
  });

  it('autorise un membre à s’inscrire à une mission en ajoutant son UID', async () => {
    await assertSucceeds(updateDoc(doc(memberDb(), 'missions_benevolat', 'mission-1'), {
      participants: arrayUnion('member-ok'),
    }));
  });

  it('autorise un membre à se désinscrire de sa mission', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'missions_benevolat', 'mission-1'), {
        participants: ['other-member', 'member-ok'],
      });
    });
    await assertSucceeds(updateDoc(doc(memberDb(), 'missions_benevolat', 'mission-1'), {
      participants: arrayRemove('member-ok'),
    }));
  });

  it('refuse à un membre d’inscrire un autre UID', async () => {
    await assertFails(updateDoc(doc(memberDb(), 'missions_benevolat', 'mission-1'), {
      participants: arrayUnion('another-user'),
    }));
  });

  it('refuse à un membre de modifier le titre en même temps que les participants', async () => {
    await assertFails(updateDoc(doc(memberDb(), 'missions_benevolat', 'mission-1'), {
      title: 'Mission détournée',
      participants: arrayUnion('member-ok'),
    }));
  });
});


describe('règles Firestore du forum et de la messagerie', () => {
  it('autorise une publication de forum attribuée à son auteur authentifié', async () => {
    const db = memberDb();
    await assertSucceeds(setDoc(doc(db, 'forum', 'post-valid'), {
      authorId: 'member-ok',
      authorName: 'Membre',
      title: 'Annonce',
      content: 'Bonjour à tous',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse une publication de forum usurpant un autre auteur', async () => {
    const db = memberDb();
    await assertFails(setDoc(doc(db, 'forum', 'post-forged'), {
      authorId: 'another-user',
      authorName: 'Membre',
      content: 'Publication usurpée',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse les champs arbitraires dans une publication de forum', async () => {
    const db = memberDb();
    await assertFails(setDoc(doc(db, 'forum', 'post-extra'), {
      authorId: 'member-ok',
      authorName: 'Membre',
      content: 'Contenu',
      isAdmin: true,
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse de modifier l’identité de l’auteur d’une publication existante', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'forum', 'post-existing'), {
        authorId: 'member-ok',
        authorName: 'Membre',
        content: 'Contenu initial',
        createdAt: new Date(),
      });
    });
    await assertFails(updateDoc(doc(memberDb(), 'forum', 'post-existing'), {
      authorId: 'another-user',
    }));
  });

  it('autorise un message dont l’expéditeur correspond au compte authentifié', async () => {
    const db = memberDb();
    await assertSucceeds(setDoc(doc(db, 'messages', 'message-valid'), {
      senderId: 'member-ok',
      recipientId: 'member-late',
      content: 'Bonjour',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse un message qui usurpe l’expéditeur', async () => {
    const db = memberDb();
    await assertFails(setDoc(doc(db, 'messages', 'message-forged'), {
      senderId: 'another-user',
      recipientId: 'member-late',
      content: 'Bonjour',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse les champs arbitraires dans un message', async () => {
    const db = memberDb();
    await assertFails(setDoc(doc(db, 'messages', 'message-extra'), {
      senderId: 'member-ok',
      recipientId: 'member-late',
      content: 'Bonjour',
      role: 'admin',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse à un expéditeur de changer le destinataire après création', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'messages', 'message-existing'), {
        senderId: 'member-ok',
        recipientId: 'member-late',
        content: 'Bonjour',
        createdAt: new Date(),
      });
    });
    await assertFails(updateDoc(doc(memberDb(), 'messages', 'message-existing'), {
      recipientId: 'member-suspended',
    }));
  });
});

describe('règles Firestore des formulaires publics', () => {
  it('accepte une demande de contact valide avec horodatage serveur', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(doc(db, 'contact_messages', 'contact-valid'), {
      name: 'Alex',
      email: 'alex@example.com',
      subject: 'Information',
      message: 'Bonjour, je souhaite en savoir plus.',
      status: 'nouveau',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse une demande de contact contenant un champ inattendu', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'contact_messages', 'contact-extra'), {
      name: 'Alex',
      email: 'alex@example.com',
      subject: 'Information',
      message: 'Bonjour',
      status: 'nouveau',
      role: 'admin',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse une demande de contact avec adresse e-mail invalide', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'contact_messages', 'contact-invalid-email'), {
      name: 'Alex',
      email: 'pas-une-adresse',
      subject: 'Information',
      message: 'Bonjour',
      status: 'nouveau',
      createdAt: serverTimestamp(),
    }));
  });

  it('accepte une demande de pré-adhésion valide', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(doc(db, 'membership_requests', 'membership-valid'), {
      nom: 'Alex Martin',
      email: 'alex@example.com',
      telephone: '+23670000000',
      categorie: 'benevole',
      motivation: 'Je souhaite participer aux activités.',
      statut: 'en_attente',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse une demande de pré-adhésion qui tente de choisir un statut privilégié', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'membership_requests', 'membership-forged'), {
      nom: 'Alex Martin',
      email: 'alex@example.com',
      telephone: '+23670000000',
      categorie: 'benevole',
      motivation: 'Motivation',
      statut: 'actif',
      createdAt: serverTimestamp(),
    }));
  });

  it('accepte une inscription newsletter limitée à e-mail et horodatage serveur', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(setDoc(doc(db, 'newsletter', 'newsletter-valid'), {
      email: 'alex@example.com',
      createdAt: serverTimestamp(),
    }));
  });

  it('refuse une inscription newsletter avec données supplémentaires', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'newsletter', 'newsletter-extra'), {
      email: 'alex@example.com',
      role: 'admin',
      createdAt: serverTimestamp(),
    }));
  });
});
