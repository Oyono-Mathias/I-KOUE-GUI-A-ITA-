import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

const app = initializeApp();
const FIRESTORE_DATABASE_ID = 'ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5';
const db = getFirestore(app, FIRESTORE_DATABASE_ID);
const auth = getAuth(app);

const ALLOWED_CREATOR_ROLES = new Set([
  'president',
  'president_fondateur',
  'secretaire_general',
  'secretaire',
  'super_admin',
]);
const ALLOWED_CATEGORIES = new Set(['actif', 'bienfaiteur', 'fondateur']);

interface CreateUserInput {
  nom?: unknown;
  email?: unknown;
  password?: unknown;
  telephone?: unknown;
  categorie?: unknown;
}

const requiredString = (value: unknown, field: string, maxLength: number): string => {
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `Le champ ${field} est obligatoire.`);
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new HttpsError('invalid-argument', `Le champ ${field} est invalide.`);
  }
  return normalized;
};

export const createUser = onCall(
  { region: 'us-central1' },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Vous devez être connecté pour créer un membre.');
    }

    // Le rôle est lu depuis Firestore côté serveur : aucune valeur de rôle envoyée
    // par le navigateur ou présente dans un token client n'est considérée fiable.
    const callerSnapshot = await db.collection('users').doc(request.auth.uid).get();
    if (!callerSnapshot.exists) {
      throw new HttpsError('permission-denied', 'Profil utilisateur introuvable.');
    }

    const caller = callerSnapshot.data();
    const callerRole = caller?.role;
    const callerStatus = caller?.statut ?? caller?.status;
    if (callerStatus === 'suspendu' || typeof callerRole !== 'string' || !ALLOWED_CREATOR_ROLES.has(callerRole)) {
      throw new HttpsError('permission-denied', 'Votre rôle ne permet pas de créer un membre.');
    }

    const input = (request.data ?? {}) as CreateUserInput;
    const nom = requiredString(input.nom, 'nom', 120);
    const email = requiredString(input.email, 'email', 254).toLowerCase();
    const password = requiredString(input.password, 'mot de passe', 128);
    const telephone = typeof input.telephone === 'string' ? input.telephone.trim().slice(0, 30) : '';
    const categorie = typeof input.categorie === 'string' && ALLOWED_CATEGORIES.has(input.categorie)
      ? input.categorie
      : 'actif';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.');
    }
    if (password.length < 6) {
      throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir au moins 6 caractères.');
    }

    let createdUid: string | undefined;
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: nom,
        disabled: false,
      });
      createdUid = userRecord.uid;

      await db.collection('users').doc(userRecord.uid).create({
        uid: userRecord.uid,
        nom,
        displayName: nom,
        email,
        telephone,
        role: 'membre',
        categorie,
        statut: 'actif',
        createdAt: FieldValue.serverTimestamp(),
        createdBy: request.auth.uid,
      });

      return { uid: userRecord.uid, role: 'membre' as const };
    } catch (error) {
      // Si Firestore échoue après la création Auth, supprimer le compte Auth
      // pour éviter un compte orphelin sans profil applicatif.
      if (createdUid) {
        try {
          await auth.deleteUser(createdUid);
        } catch (cleanupError) {
          console.error('Échec du nettoyage du compte Auth après erreur Firestore.', cleanupError);
        }
      }

      const code = (error as { code?: string })?.code;
      if (code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'Cette adresse e-mail est déjà utilisée.');
      }
      if (error instanceof HttpsError) throw error;
      console.error('Échec de création du membre.', error);
      throw new HttpsError('internal', 'Impossible de créer le membre pour le moment.');
    }
  },
);
