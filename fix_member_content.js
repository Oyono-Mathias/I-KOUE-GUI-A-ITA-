import fs from 'fs';
let path = 'src/pages/dashboard/MemberDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const tabContent = `
      {/* TAB: BENEVOLAT */}
      <div className={\`tab-content \${activeTab === 'benevolat' ? 'active' : ''}\`}>
        <div className="section-header" style={{ marginBottom: '16px' }}>
          <h2>🤝 Espace Bénévolat</h2>
          <p>Engagez-vous sur les missions de l'association</p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {missionsBenevolat.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#1a1a1a' }}>Aucune mission pour le moment</h3>
                    <p style={{ margin: 0, color: '#666' }}>Le Bureau n'a pas encore publié de nouvelles missions.</p>
                </div>
            ) : (
                missionsBenevolat.map((mission: any) => {
                    const isRegistered = mission.participants?.includes(userData?.uid);
                    const isFull = mission.requiredVolunteers && mission.participants?.length >= mission.requiredVolunteers;
                    const canRegister = mission.status === 'ouverte' && !isFull && !isRegistered;
                    
                    return (
                        <div key={mission.id} className="card" style={{ padding: '20px', borderRadius: '12px', borderLeft: isRegistered ? '4px solid #128C7E' : '4px solid #f9a826', background: isRegistered ? '#f0fcf5' : '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '18px' }}>{mission.title}</h3>
                                {isRegistered && <span style={{ background: '#128C7E', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Inscrit(e)</span>}
                                {isFull && !isRegistered && mission.status === 'ouverte' && <span style={{ background: '#e0e0e0', color: '#666', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Complet</span>}
                                {mission.status === 'terminee' && <span style={{ background: '#9e9e9e', color: 'white', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>Terminée</span>}
                            </div>
                            
                            <p style={{ fontSize: '14px', color: '#4a4a4a', marginBottom: '16px', lineHeight: '1.5' }}>{mission.description}</p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '13px', color: '#666' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>📅</span> {formatDate(mission.date)}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '16px' }}>📍</span> {mission.location}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: '1 / -1' }}>
                                    <span style={{ fontSize: '16px' }}>👥</span> 
                                    {mission.participants?.length || 0} / {mission.requiredVolunteers || '∞'} bénévole(s)
                                </div>
                            </div>
                            
                            {isRegistered ? (
                                <button 
                                    className="btn btn-outline btn-block" 
                                    style={{ color: '#d32f2f', borderColor: '#d32f2f' }}
                                    onClick={async () => {
                                        if (window.confirm('Voulez-vous annuler votre engagement ?')) {
                                            await updateDoc(doc(db, 'missions_benevolat', mission.id), {
                                                participants: arrayRemove(userData?.uid)
                                            });
                                        }
                                    }}
                                >
                                    Se désister
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-primary btn-block" 
                                    disabled={!canRegister}
                                    style={{ background: !canRegister ? '#ccc' : '#f9a826', color: !canRegister ? '#666' : '#1a1a1a', border: 'none', fontWeight: 'bold' }}
                                    onClick={async () => {
                                        if (canRegister) {
                                            await updateDoc(doc(db, 'missions_benevolat', mission.id), {
                                                participants: arrayUnion(userData?.uid)
                                            });
                                        }
                                    }}
                                >
                                    S'engager pour cette mission
                                </button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>
`;

content = content.replace(
  /\{\/\* TAB 4: DOCUMENTS \*\/\}/g,
  tabContent + "\n\n      {/* TAB 4: DOCUMENTS */}"
);

fs.writeFileSync(path, content);
