import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCXZLTvYx5lIz0SVQQt_fvPdsjAzRszGLI",
  authDomain: "gen-lang-client-0982990158.firebaseapp.com",
  projectId: "gen-lang-client-0982990158",
  storageBucket: "gen-lang-client-0982990158.firebasestorage.app",
  messagingSenderId: "831858291856",
  appId: "1:831858291856:web:f2215b8052f8ea59dcd415"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, "ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5");

getDocs(collection(db, "domaines")).then((snap) => {
  console.log("Success with long polling! Docs:", snap.size);
  process.exit(0);
}).catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
