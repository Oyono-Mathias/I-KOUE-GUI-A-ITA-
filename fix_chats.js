import fs from 'fs';

const files = [
  { path: 'src/pages/dashboard/VicePresidentDashboard.tsx', role: 'vice_president', sender: 'Vice-Président', inputId: 'vpChatMsg' },
  { path: 'src/pages/dashboard/SecretaireDashboard.tsx', role: 'secretaire', sender: 'Secrétaire Général', inputId: 'secChatMsg' },
  { path: 'src/pages/dashboard/TresorierDashboard.tsx', role: 'tresorier', sender: 'Trésorier Général', inputId: 'tresChatMsg' },
  { path: 'src/pages/dashboard/ConseillerDashboard.tsx', role: 'conseiller', sender: 'Conseiller', inputId: 'consChatMsg' },
  { path: 'src/pages/dashboard/PresidentDashboard.tsx', role: 'president', sender: 'Président', inputId: 'presChatMsg' },
  { path: 'src/pages/communication/CommunicateurDashboard.tsx', role: 'communicateur', sender: 'Chargé de Communication', inputId: 'comChatMsg' }
];

files.forEach(({ path, role, sender, inputId }) => {
  if (!fs.existsSync(path)) return;
  
  let content = fs.readFileSync(path, 'utf8');
  
  // Extract the part to replace using regex. 
  // We look for {/* TAB MESSAGES */} or {/* TAB BOARD MESSAGES */} and the corresponding div
  // A bit tricky with regex, let's use string manipulation
  
  const startMarker1 = "{/* TAB MESSAGES */}";
  const startMarker2 = "{/* TAB BOARD MESSAGES */}";
  let startIndex = content.indexOf(startMarker1);
  if (startIndex === -1) startIndex = content.indexOf(startMarker2);
  
  if (startIndex === -1) {
    console.log(`Chat not found in ${path}`);
    return;
  }
  
  // Find the end of the tab-content div.
  // The structure is generally:
  // <div className={`tab-content ${activeTab === 'messages' ? 'active' : ''}`}> ... </div>
  // followed by another {/* TAB ... */} or {/* BOTTOM NAV
  
  let endIndex = content.indexOf("{/* TAB ", startIndex + 20);
  if (endIndex === -1) endIndex = content.indexOf("{/* BOTTOM NAV", startIndex + 20);
  if (endIndex === -1) endIndex = content.indexOf("{/* ============================================", startIndex + 20);
  
  if (endIndex === -1) {
    console.log(`Could not find end of chat tab in ${path}`);
    return;
  }
  
  // Extract exact activeTab condition used in the file for this tab
  let originalTabCode = content.substring(startIndex, endIndex);
  
  let activeTabStr = "activeTab === 'messages'";
  if (originalTabCode.includes("activeTab === 'board_messages'")) {
    activeTabStr = "activeTab === 'board_messages'";
  }
  
  // Also fix import for formatDate if needed, though they might already have it or we can just use new Date
  
  const newChatCode = `{/* TAB MESSAGES */}
      <div className={\`tab-content \${\${activeTabStr} ? 'active' : ''}\`}>
        <div className="section-header" style={{ marginBottom: '8px', padding: '0 16px' }}><h2>💬 Chat Bureau</h2><p>Boîte de réception centralisée</p></div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '70vh', minHeight: '500px', padding: 0, overflow: 'hidden', background: '#efeae2', borderRadius: '12px' }}>
            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {boardMessages.map(m => {
                    const isMe = m.role === '${role}';
                    return (
                    <div key={m.id} style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start', 
                        background: isMe ? '#dcf8c6' : '#ffffff',
                        padding: '6px 10px',
                        borderRadius: '12px',
                        borderTopRightRadius: isMe ? '0px' : '12px',
                        borderTopLeftRadius: !isMe ? '0px' : '12px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {!isMe && <div style={{ fontSize: '12px', color: '#128C7E', fontWeight: 'bold', marginBottom: '2px' }}>{m.sender}</div>}
                        <div style={{ fontSize: '14px', color: '#303030', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>{m.text}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.45)', textAlign: 'right', marginTop: '2px' }}>
                            {m.timestamp ? new Date(m.timestamp.seconds * 1000).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '...'}
                        </div>
                    </div>
                )})}
                {boardMessages.length === 0 && <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '40px', background: 'rgba(255,255,255,0.8)', padding: '8px', borderRadius: '8px', alignSelf: 'center' }}>Aucun message. Commencez la discussion !</p>}
            </div>
            
            {/* Input Area */}
            <div style={{ background: '#f0f0f0', padding: '10px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <textarea 
                    id="${inputId}" 
                    placeholder="Taper un message..." 
                    style={{ 
                        flex: 1, 
                        minHeight: '44px',
                        maxHeight: '120px', 
                        padding: '12px 16px', 
                        borderRadius: '24px', 
                        border: 'none', 
                        outline: 'none',
                        resize: 'none',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        lineHeight: '1.4',
                        background: '#ffffff',
                        boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
                    }} 
                    rows={1}
                    onInput={(e) => {
                        const target = e.target;
                        target.style.height = 'auto';
                        target.style.height = \`\${target.scrollHeight}px\`;
                    }}
                    onKeyDown={async (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            const input = document.getElementById('${inputId}');
                            if(input.value.trim()) {
                                await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: '${sender}', role: '${role}', timestamp: serverTimestamp() });
                                input.value = '';
                                input.style.height = 'auto';
                            }
                        }
                    }}
                />
                <button 
                    onClick={async () => {
                        const input = document.getElementById('${inputId}');
                        if(input.value.trim()) {
                            await addDoc(collection(db, 'board_messages'), { text: input.value.trim(), sender: '${sender}', role: '${role}', timestamp: serverTimestamp() });
                            input.value = '';
                            input.style.height = 'auto';
                        }
                    }}
                    style={{ 
                        background: '#128C7E', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '44px', 
                        height: '44px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ transform: 'translateX(2px)' }}>
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                    </svg>
                </button>
            </div>
        </div>
      </div>

      `;
  
  content = content.substring(0, startIndex) + newChatCode + content.substring(endIndex);
  fs.writeFileSync(path, content);
  console.log(`Updated chat in ${path}`);
});
