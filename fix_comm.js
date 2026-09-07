import fs from 'fs';
let commPath = 'src/pages/communication/CommunicateurDashboard.tsx';
if (fs.existsSync(commPath)) {
  let content = fs.readFileSync(commPath, 'utf8');
  if (!content.includes('const [boardMessages, setBoardMessages] = useState<any[]>([]);')) {
     content = content.replace('const [messages, setMessages] = useState<any[]>([]);', 
      `const [messages, setMessages] = useState<any[]>([]);
  const [boardMessages, setBoardMessages] = useState<any[]>([]);
  const [editorialCalendar, setEditorialCalendar] = useState<any[]>([]);`);
  }
  
  if (!content.includes('unsubBoardMessages')) {
      content = content.replace('const mediaQuery = query(collection(db, \'media\'), orderBy(\'uploadedAt\', \'desc\'));', 
    `const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
      const boardQuery = query(collection(db, 'board_messages'), orderBy('timestamp', 'asc'));
      const calendarQuery = query(collection(db, 'editorial_calendar'), orderBy('date', 'desc'));`);
      
      content = content.replace('const unsubMedia = onSnapshot(mediaQuery, (snap) => {', 
        `const unsubBoardMessages = onSnapshot(boardQuery, (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
          const unsubCalendar = onSnapshot(calendarQuery, (snap) => setEditorialCalendar(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
          const unsubMedia = onSnapshot(mediaQuery, (snap) => {`);
          
      content = content.replace('return () => { unsubNews(); unsubDomains(); unsubMessages(); unsubMedia(); };', 
        'return () => { unsubNews(); unsubDomains(); unsubMessages(); unsubMedia(); unsubBoardMessages(); unsubCalendar(); };');
  }

  // Fix the unknown file type, ensure it works.
  content = content.replace(/const file = e\.target\.files\[0\];/g, "const file = (e.target as HTMLInputElement).files?.[0] as File | undefined;");
  
  fs.writeFileSync(commPath, content);
}
