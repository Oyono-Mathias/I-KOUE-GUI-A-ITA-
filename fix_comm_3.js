import fs from 'fs';
let commPath = 'src/pages/communication/CommunicateurDashboard.tsx';
if (fs.existsSync(commPath)) {
  let content = fs.readFileSync(commPath, 'utf8');
  content = content.replace("const boardQuery = query(collection(db, 'board_messages'), orderBy('timestamp', 'asc'));\n      const calendarQuery = query(collection(db, 'editorial_calendar'), orderBy('date', 'desc'));\n      const boardQuery = query(collection(db, 'board_messages'), orderBy('timestamp', 'asc'));\n      const calendarQuery = query(collection(db, 'editorial_calendar'), orderBy('date', 'desc'));", 
  "const boardQuery = query(collection(db, 'board_messages'), orderBy('timestamp', 'asc'));\n      const calendarQuery = query(collection(db, 'editorial_calendar'), orderBy('date', 'desc'));");
  
  // also fix unknown file type in line 477
  content = content.replace(/const file = e\.target\.files\[0\];/g, "const file = (e.target as HTMLInputElement).files?.[0];");
  content = content.replace(/name: file\.name,\n\s+type: file\.type,\n\s+size: file\.size,/g, `name: (file as File).name,
                    type: (file as File).type,
                    size: (file as File).size,`);
  content = content.replace(/uploadBytes\(storageRef, file\)/g, `uploadBytes(storageRef, file as File)`);
  
  fs.writeFileSync(commPath, content);
}
