import fs from 'fs';
let path = 'src/pages/dashboard/VicePresidentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const benevolatContent = `
        <div className="section-header" style={{ marginTop: '32px' }}>
            <h2>🤝 Missions de Bénévolat (Membres)</h2>
            <button className="btn btn-primary" onClick={() => setMissionModalOpen(true)}>+ Nouvelle mission</button>
        </div>
        <div className="card">
            {missionsBenevolat.length === 0 && <p className="text-center text-muted">Aucune mission publiée.</p>}
            {missionsBenevolat.map(m => (
                <div key={m.id} className="transaction-item" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                        <div className="transaction-title">{m.title}</div>
                        <div className="transaction-meta">Date: {formatDate(m.date)} • Lieu: {m.location}</div>
                        <div style={{ fontSize: '13px', marginTop: '4px', color: '#666' }}>{m.description}</div>
                        <div style={{ marginTop: '8px' }}>
                            <span className="badge badge-info" style={{ marginRight: '8px' }}>{m.participants?.length || 0} / {m.requiredVolunteers || '∞'} bénévoles</span>
                            <span className={\`badge \${m.status === 'ouverte' ? 'badge-success' : m.status === 'complete' ? 'badge-warning' : 'badge-danger'}\`}>
                                {m.status === 'ouverte' ? 'Ouverte' : m.status === 'complete' ? 'Complète' : 'Terminée'}
                            </span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        {m.status === 'ouverte' && (
                            <button className="btn btn-outline btn-small" onClick={async () => {
                                await updateDoc(doc(db, 'missions_benevolat', m.id), { status: 'terminee' });
                            }}>Terminer</button>
                        )}
                        {m.status === 'terminee' && (
                            <button className="btn btn-outline btn-small" onClick={async () => {
                                await updateDoc(doc(db, 'missions_benevolat', m.id), { status: 'ouverte' });
                            }}>Rouvrir</button>
                        )}
                    </div>
                </div>
            ))}
        </div>
`;

content = content.replace(
  /\{\/\* TAB OBJECTIVES \*\/\}/g,
  benevolatContent + "\n\n    {/* TAB OBJECTIVES */}"
);

fs.writeFileSync(path, content);
