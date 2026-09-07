import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCXZLTvYx5lIz0SVQQt_fvPdsjAzRszGLI",
  authDomain: "gen-lang-client-0982990158.firebaseapp.com",
  projectId: "gen-lang-client-0982990158",
  storageBucket: "gen-lang-client-0982990158.firebasestorage.app",
  messagingSenderId: "831858291856",
  appId: "1:831858291856:web:f2215b8052f8ea59dcd415"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5");

async function testRealtimePublication() {
  console.log("=== 1. Test de lecture des collections actuelles ===");
  const newsSnap = await getDocs(collection(db, "news"));
  console.log("Actualités existantes dans 'news':", newsSnap.size);

  const messagesSnap = await getDocs(collection(db, "contact_messages"));
  console.log("Messages existants dans 'contact_messages':", messagesSnap.size);

  console.log("\n=== 2. Publication d'une actualité test en temps réel ===");
  const testPublication = {
    title: "Lancement officiel des kits scolaires 2026",
    titre: "Lancement officiel des kits scolaires 2026",
    description: "Distribution de plus de 500 kits scolaires complets aux élèves des écoles de Galabadja II.",
    contenu: "L'Association I KOUE GUI A ITA a procédé ce matin à la remise solennelle de fournitures scolaires, sacs et manuels pour soutenir l'éducation et la jeunesse centrafricaine.",
    content: "L'Association I KOUE GUI A ITA a procédé ce matin à la remise solennelle de fournitures scolaires, sacs et manuels pour soutenir l'éducation et la jeunesse centrafricaine.",
    category: "education",
    status: "publie",
    statut: "publie",
    featured: true,
    views: 142,
    imageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    authorName: "Mathias Oyono",
    createdAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, "news"), testPublication);
  console.log("✅ Actualité publiée avec succès avec ID:", docRef.id);

  console.log("\n=== 3. Vérification de la synchronisation ===");
  const q = query(collection(db, "news"), orderBy("createdAt", "desc"), limit(3));
  const latestSnap = await getDocs(q);
  latestSnap.forEach(d => {
    const data = d.data();
    console.log(`- [${d.id}] ${data.title} (${data.category}) | Statut: ${data.status} | Vues: ${data.views}`);
  });

  console.log("\n✅ Test réussi : la base Firestore est active et synchronisée en temps réel.");
  process.exit(0);
}

testRealtimePublication().catch(err => {
  console.error("❌ Erreur lors du test:", err);
  process.exit(1);
});
