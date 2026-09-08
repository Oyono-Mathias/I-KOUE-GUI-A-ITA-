import fs from 'fs';

const path = 'src/pages/dashboard/SecretaireDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('const [commissions')) {
  // 1. Add states
  const stateInjection = `  const [commissions, setCommissions] = useState<any[]>([]);
  const [suppleanceHistory, setSuppleanceHistory] = useState<any[]>([]);
  const [isSuppleanceActive, setIsSuppleanceActive] = useState(false);
`;
  content = content.replace(
    /const \[tasks, setTasks\] = useState<any\[\]>\(\[\]\);/g,
    `const [tasks, setTasks] = useState<any[]>([]);\n${stateInjection}`
  );

  // 2. Add listeners in useEffect
  const listenerInjection = `    const unsubCommissions = onSnapshot(query(collection(db, 'commissions'), orderBy('createdAt', 'desc')), (snap) => setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleance = onSnapshot(query(collection(db, 'suppleance_history'), orderBy('date', 'desc')), (snap) => setSuppleanceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSuppleanceState = onSnapshot(doc(db, 'system', 'suppleance'), (docSnap) => {
      if (docSnap.exists()) setIsSuppleanceActive(docSnap.data().active || false);
    });
`;
  content = content.replace(
    /const unsubTasks = onSnapshot.*?setTasks.*?;/g,
    `const unsubTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snap) => setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));\n${listenerInjection}`
  );

  // 3. Update return function to unsubscribe
  content = content.replace(
    /return \(\) => \{ unsubMembers\(\); unsubDocs\(\); unsubPV\(\); unsubConvos\(\); unsubMod\(\); unsubMeetings\(\); unsubBoardMessages\(\); unsubTasks\(\); unsubCourriers\(\); \};/g,
    `return () => { unsubMembers(); unsubDocs(); unsubPV(); unsubConvos(); unsubMod(); unsubMeetings(); unsubBoardMessages(); unsubTasks(); unsubCourriers(); unsubCommissions(); unsubSuppleance(); unsubSuppleanceState(); };`
  );
  
  fs.writeFileSync(path, content);
}
