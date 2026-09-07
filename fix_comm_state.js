import fs from 'fs';
let commPath = 'src/pages/communication/CommunicateurDashboard.tsx';
if (fs.existsSync(commPath)) {
  let content = fs.readFileSync(commPath, 'utf8');
  if (!content.includes('const [boardMessages, setBoardMessages] = useState<any[]>([]);')) {
     content = content.replace('const [messages, setMessages] = useState<any[]>([]);', 
      `const [messages, setMessages] = useState<any[]>([]);\n  const [boardMessages, setBoardMessages] = useState<any[]>([]);\n  const [editorialCalendar, setEditorialCalendar] = useState<any[]>([]);`);
  }
  
  if (!content.includes('const boardQuery = query(collection(db, \'board_messages\')')) {
      content = content.replace('const mediaQuery = query(collection(db, \'media\'), orderBy(\'uploadedAt\', \'desc\'));', 
    `const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));\n      const boardQuery = query(collection(db, 'board_messages'), orderBy('timestamp', 'asc'));\n      const calendarQuery = query(collection(db, 'editorial_calendar'), orderBy('date', 'desc'));`);
      
      content = content.replace('unsubMedia = onSnapshot(mediaQuery, (snapshot) => {', 
        `const unsubBoardMessages = onSnapshot(boardQuery, (snap) => setBoardMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));\n          const unsubCalendar = onSnapshot(calendarQuery, (snap) => setEditorialCalendar(snap.docs.map(d => ({ id: d.id, ...d.data() }))));\n          unsubMedia = onSnapshot(mediaQuery, (snapshot) => {`);
          
      content = content.replace('return () => { unsubNews?.(); unsubDomains?.(); unsubMessages?.(); unsubMedia?.(); unsubConfig?.(); };', 
        'return () => { unsubNews?.(); unsubDomains?.(); unsubMessages?.(); unsubMedia?.(); unsubConfig?.(); unsubBoardMessages?.(); unsubCalendar?.(); };');
  }
  
  // also reader.readAsDataURL(file)
  content = content.replace(/reader\.readAsDataURL\(file\);/g, "reader.readAsDataURL(file as File);");
  fs.writeFileSync(commPath, content);
}
