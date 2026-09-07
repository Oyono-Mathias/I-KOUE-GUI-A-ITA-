import fs from 'fs';
let commPath = 'src/pages/communication/CommunicateurDashboard.tsx';
if (fs.existsSync(commPath)) {
  let content = fs.readFileSync(commPath, 'utf8');
  content = content.replace(
    /const \[messages, setMessages\] = useState<MessageItem\[\]>\(\[\]\);/g, 
    "const [messages, setMessages] = useState<MessageItem[]>([]);\n  const [boardMessages, setBoardMessages] = useState<any[]>([]);\n  const [editorialCalendar, setEditorialCalendar] = useState<any[]>([]);"
  );
  fs.writeFileSync(commPath, content);
}
