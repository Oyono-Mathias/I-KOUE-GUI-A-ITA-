import fs from 'fs';
let path = 'src/pages/dashboard/VicePresidentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('missionsBenevolat')) {
  content = content.replace(
    "const [tasks, setTasks] = useState<any[]>([]);",
    "const [tasks, setTasks] = useState<any[]>([]);\n  const [missionsBenevolat, setMissionsBenevolat] = useState<any[]>([]);\n  const [missionModalOpen, setMissionModalOpen] = useState(false);"
  );
  
  content = content.replace(
    "const unsubTasks = onSnapshot(query(collection(db, 'tasks')), (snap) => {",
    `const unsubMissions = onSnapshot(query(collection(db, 'missions_benevolat'), orderBy('createdAt', 'desc')), (snap) => {
        setMissionsBenevolat(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), (snap) => {`
  );
  
  content = content.replace(
    "unsubBoardMessages(); unsubExpenses(); };",
    "unsubBoardMessages(); unsubExpenses(); unsubMissions(); };"
  );
  
  fs.writeFileSync(path, content);
}
