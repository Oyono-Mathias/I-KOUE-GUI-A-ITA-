import fs from 'fs';
let path = 'src/pages/dashboard/MemberDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('missionsBenevolat')) {
  content = content.replace(
    "const [events, setEvents] = useState<any[]>([]);",
    "const [events, setEvents] = useState<any[]>([]);\n  const [missionsBenevolat, setMissionsBenevolat] = useState<any[]>([]);"
  );
  
  content = content.replace(
    "import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';",
    "import { collection, query, orderBy, onSnapshot, where, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';"
  );
  
  content = content.replace(
    "const unsubPayments = onSnapshot(query(collection(db, 'finances'), where('type', '==', 'recette'), where('memberId', '==', userData.uid), orderBy('date', 'desc')), (snap) => {",
    `const unsubMissions = onSnapshot(query(collection(db, 'missions_benevolat'), orderBy('createdAt', 'desc')), (snap) => {
      setMissionsBenevolat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubPayments = onSnapshot(query(collection(db, 'finances'), where('type', '==', 'recette'), where('memberId', '==', userData.uid), orderBy('date', 'desc')), (snap) => {`
  );
  
  content = content.replace(
    "return () => { unsubNews(); unsubPayments(); unsubDocs(); unsubForum(); unsubEvents(); unsubNotifs(); };",
    "return () => { unsubNews(); unsubPayments(); unsubDocs(); unsubForum(); unsubEvents(); unsubNotifs(); unsubMissions(); };"
  );
  
  fs.writeFileSync(path, content);
}
