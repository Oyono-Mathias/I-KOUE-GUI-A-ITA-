import fs from 'fs';
let path = 'src/pages/dashboard/VicePresidentDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const saveMissionFunc = `
  const saveMission = async (e: React.FormEvent) => {
    e.preventDefault();
    const dateInput = (document.getElementById('missionDate') as HTMLInputElement).value;
    const reqVol = (document.getElementById('missionVolunteers') as HTMLInputElement).value;
    const data = {
        title: (document.getElementById('missionTitle') as HTMLInputElement).value,
        description: (document.getElementById('missionDescription') as HTMLTextAreaElement).value,
        location: (document.getElementById('missionLocation') as HTMLInputElement).value,
        date: dateInput ? new Date(dateInput) : null,
        requiredVolunteers: reqVol ? parseInt(reqVol) : 0,
        participants: [],
        status: 'ouverte',
        createdBy: 'vice_president',
        createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'missions_benevolat'), data);
    setMissionModalOpen(false);
  };
`;

content = content.replace(
  /const saveTask = async \(e: React\.FormEvent\) => \{/g,
  saveMissionFunc + "\n\n  const saveTask = async (e: React.FormEvent) => {"
);

const missionModalHtml = `
    {missionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
            <div style={{ background: 'var(--blanc-pur)', borderRadius: 'var(--radius-lg)', maxWidth: '600px', width: '100%', padding: '24px' }}>
                <h3 style={{ marginTop: 0, color: 'var(--bleu-rca)' }}>Nouvelle Mission Bénévolat</h3>
                <form onSubmit={saveMission}>
                    <div className="form-group"><label>Titre de la mission</label><input type="text" id="missionTitle" required style={{ width: '100%', padding: '8px' }} /></div>
                    <div className="form-group"><label>Description</label><textarea id="missionDescription" rows={3} style={{ width: '100%', padding: '8px' }} required></textarea></div>
                    <div className="form-row">
                        <div className="form-group"><label>Date de l'événement</label><input type="date" id="missionDate" required style={{ width: '100%', padding: '8px' }} /></div>
                        <div className="form-group"><label>Lieu</label><input type="text" id="missionLocation" required style={{ width: '100%', padding: '8px' }} /></div>
                    </div>
                    <div className="form-group">
                        <label>Nombre de bénévoles requis (0 = illimité)</label>
                        <input type="number" id="missionVolunteers" min="0" defaultValue="0" style={{ width: '100%', padding: '8px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" className="btn btn-primary">Publier la mission</button>
                        <button type="button" className="btn btn-outline" onClick={() => setMissionModalOpen(false)}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    )}
`;

content = content.replace(
  /\{taskModalOpen && \(/g,
  missionModalHtml + "\n\n    {taskModalOpen && ("
);

fs.writeFileSync(path, content);
