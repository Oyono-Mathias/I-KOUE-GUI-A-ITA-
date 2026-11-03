import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { canCreateMember } from './authorization';

const app = initializeApp();
const FIRESTORE_DATABASE_ID = 'ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5';
const db = getFirestore(app, FIRESTORE_DATABASE_ID);
const auth = getAuth(app);

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
  {
    region: 'us-central1',
    // Les callable Functions autorisent déjà les origines par défaut.
    // L'option explicite garantit le fonctionnement des previews Vercel.
    // L'authentification Firebase et le contrôle RBAC restent obligatoires.
    cors: true,
  },
  async (request) => {
    let stage = 'authentication-check';
    let createdUid: string | undefined;

    try {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Vous devez être connecté pour créer un membre.');
      }

      // Le rôle est lu depuis Firestore côté serveur : aucune valeur de rôle envoyée
      // par le navigateur ou présente dans un token client n'est considérée fiable.
      stage = 'caller-profile-read';
      const callerSnapshot = await db.collection('users').doc(request.auth.uid).get();
      if (!callerSnapshot.exists) {
        throw new HttpsError('permission-denied', 'Profil utilisateur introuvable.');
      }

      const caller = callerSnapshot.data();
      const callerRole = caller?.role;
      const callerStatus = caller?.statut ?? caller?.status;
      stage = 'caller-authorization';
      if (!canCreateMember(callerRole, callerStatus)) {
        throw new HttpsError('permission-denied', 'Votre rôle ne permet pas de créer un membre.');
      }

      stage = 'input-validation';
      const input = (request.data ?? {}) as CreateUserInput;
      const nom = requiredString(input.nom, 'nom', 120);
      const email = requiredString(input.email, 'email', 254).toLowerCase();
      if (typeof input.password !== 'string' || input.password.length < 6 || input.password.length > 128) {
        throw new HttpsError('invalid-argument', 'Le mot de passe doit contenir entre 6 et 128 caractères.');
      }
      // Ne pas trim() le mot de passe : les espaces peuvent en faire partie.
      const password = input.password;
      const telephone = typeof input.telephone === 'string' ? input.telephone.trim().slice(0, 30) : '';
      const categorie = typeof input.categorie === 'string' && ALLOWED_CATEGORIES.has(input.categorie)
        ? input.categorie
        : 'actif';

      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
        throw new HttpsError('invalid-argument', 'Adresse e-mail invalide.');
      }

      stage = 'firebase-auth-create-user';
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: nom,
        disabled: false,
      });
      createdUid = userRecord.uid;

      stage = 'firestore-profile-create';
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

      console.info('Création du membre terminée.', {
        stage: 'complete',
        uid: userRecord.uid,
        callerUid: request.auth.uid,
        databaseId: FIRESTORE_DATABASE_ID,
      });
      return { uid: userRecord.uid, role: 'membre' as const };
    } catch (error) {
      if (createdUid) {
        stage = 'firestore-profile-create-cleanup';
        try {
          await auth.deleteUser(createdUid);
        } catch (cleanupError) {
          console.error('Échec du nettoyage du compte Auth après erreur Firestore.', {
            uid: createdUid,
            error: cleanupError,
          });
        }
      }

      const candidate = error as { code?: string; message?: string; stack?: string };
      console.error('Échec de createUser.', {
        stage,
        callerUid: request.auth?.uid ?? null,
        createdUid: createdUid ?? null,
        databaseId: FIRESTORE_DATABASE_ID,
        errorCode: candidate?.code ?? null,
        errorMessage: candidate?.message ?? String(error),
        stack: candidate?.stack ?? null,
      });

      if (candidate?.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'Cette adresse e-mail est déjà utilisée.');
      }
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Impossible de créer le membre pour le moment.');
    }
  },
);
