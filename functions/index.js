const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

const DATABASE_ID = 'ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5';
const db = getFirestore(undefined, DATABASE_ID);
const CREATION_ROLES = new Set([
  'president',
  'president_fondateur',
  'secretaire_general',
  'secretaire',
  'super_admin',
  'admin',
]);

exports.createOrdinaryMember = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Connexion requise.');
  }

  const callerSnapshot = await db.collection('users').doc(request.auth.uid).get();
  const caller = callerSnapshot.data();
  if (!callerSnapshot.exists || !caller || !CREATION_ROLES.has(caller.role) || caller.statut === 'suspendu') {
    throw new HttpsError('permission-denied', 'Votre rôle ne permet pas de créer un membre.');
  }

  const { nom, email, password, telephone = '', categorie = 'actif' } = request.data || {};
  if (typeof nom !== 'string' || !nom.trim() || nom.trim().length > 120 ||
      typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== 'string' || password.length < 6 || password.length > 128 ||
      typeof telephone !== 'string' || telephone.length > 40 ||
      !['actif', 'bienfaiteur', 'fondateur'].includes(categorie)) {
    throw new HttpsError('invalid-argument', 'Les informations du membre sont invalides.');
  }

  let createdUser;
  try {
    createdUser = await getAuth().createUser({
      email: email.trim().toLowerCase(),
      password,
      displayName: nom.trim(),
    });
    await db.collection('users').doc(createdUser.uid).create({
      uid: createdUser.uid,
      nom: nom.trim(),
      displayName: nom.trim(),
      email: createdUser.email,
      telephone: telephone.trim(),
      role: 'membre',
      categorie,
      statut: 'actif',
      createdAt: new Date(),
      createdBy: request.auth.uid,
    });
    return { uid: createdUser.uid };
  } catch (error) {
    if (createdUser) {
      await getAuth().deleteUser(createdUser.uid).catch(() => undefined);
    }
    if (error instanceof HttpsError) throw error;
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Cette adresse e-mail est déjà utilisée.');
    }
    console.error('createOrdinaryMember failed', error);
    throw new HttpsError('internal', 'La création du membre a échoué.');
  }
});
