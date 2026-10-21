import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDoc, setDoc, persistentLocalCache, persistentMultipleTabManager, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import firebaseConfig from '../../firebase-applet-config.json';

const isAlreadyInitialized = getApps().length > 0;
const app = isAlreadyInitialized ? getApp() : initializeApp(firebaseConfig);

export const db = isAlreadyInitialized 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
    }, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    // Check if user exists in db
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: 'membre',
        statut: 'en_attente',
        createdAt: serverTimestamp()
      });
    }

    // Le serveur vérifie une éventuelle décision d'adhésion avant d'activer le profil.
    // Une indisponibilité temporaire de la fonction ne bloque pas la connexion :
    // le profil reste en attente jusqu'à une synchronisation réussie.
    try {
      const syncApprovedMembership = httpsCallable(functions, 'syncApprovedMembership');
      await syncApprovedMembership();
    } catch (syncError) {
      console.warn('Synchronisation de l’adhésion non disponible; le profil conserve son statut actuel.', syncError);
    }

    return user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const secondaryApp = getApps().find(a => a.name === 'SecondaryApp') || initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);
