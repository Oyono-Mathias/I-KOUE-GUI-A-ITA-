import fs from 'fs';
let path = 'firestore.rules';
let content = fs.readFileSync(path, 'utf8');
content = content.replace("'messages'", "'messages', 'missions_benevolat'");
fs.writeFileSync(path, content);
