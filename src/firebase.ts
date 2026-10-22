import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isAlreadyInitialized = getApps().length > 0;
export const app = isAlreadyInitialized ? getApp() : initializeApp(firebaseConfig);

// Set log level to avoid spamming the console with connection retry warnings
// when the user's network or browser (like Brave/Adblock) blocks WebSockets.
setLogLevel('silent');

export const db = isAlreadyInitialized
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const functions = getFunctions(app);

export const secondaryApp = getApps().find(a => a.name === 'SecondaryApp')
  || initializeApp(firebaseConfig, 'SecondaryApp');
export const secondaryAuth = getAuth(secondaryApp);
