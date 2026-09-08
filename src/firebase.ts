import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCXZLTvYx5lIz0SVQQt_fvPdsjAzRszGLI",
  authDomain: "gen-lang-client-0982990158.firebaseapp.com",
  projectId: "gen-lang-client-0982990158",
  storageBucket: "gen-lang-client-0982990158.firebasestorage.app",
  messagingSenderId: "831858291856",
  appId: "1:831858291856:web:f2215b8052f8ea59dcd415"
};

export const app = initializeApp(firebaseConfig);

// Set log level to avoid spamming the console with connection retry warnings
// when the user's network or browser (like Brave/Adblock) blocks WebSockets.
setLogLevel('silent');

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, "ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5");

export const auth = getAuth(app);

export const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);
