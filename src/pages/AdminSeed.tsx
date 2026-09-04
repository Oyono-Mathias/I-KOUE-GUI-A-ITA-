import React, { useState } from 'react';
import { seedAll } from '../utils/seedFirestore';

export default function AdminSeed() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ total: number, logs: string[] } | null>(null);

    const handleSeed = async () => {
        setLoading(true);
        setResult(null);

        const res = await seedAll();

        setResult({ total: res.total, logs: res.logs });
        setLoading(false);
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#0A3D62', marginBottom: '20px' }}>⚙️ Administration Firebase</h1>
            <p style={{ marginBottom: '30px', color: '#666' }}>
                Cet outil permet d'injecter automatiquement toutes les données de vos pages HTML (Activités, Stats, Témoignages, etc.) dans Firestore. 
                <br/><strong>Note :</strong> L'outil ne créera aucun doublon si la collection existe déjà.
            </p>

            <button 
                onClick={handleSeed} 
                disabled={loading}
                style={{
                    background: loading ? '#ccc' : '#D4A017',
                    color: loading ? '#666' : '#0A3D62',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    width: '100%'
                }}
            >
                {loading ? "⏳ Initialisation en cours..." : "🚀 INITIALISER LA BASE DE DONNÉES"}
            </button>

            {result && (
                <div style={{ marginTop: '30px', background: '#F5F7FA', padding: '20px', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                    <h3 style={{ color: result.total > 0 ? '#2E7D32' : '#0A3D62', marginBottom: '16px' }}>
                        {result.total > 0 
                            ? `🎉 Base initialisée avec succès : ${result.total} nouveaux documents créés.` 
                            : `ℹ️ Aucune modification : Toutes les collections sont déjà remplies.`}
                    </h3>
                    
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {result.logs.map((log, index) => (
                            <li key={index} style={{ 
                                padding: '10px', 
                                borderBottom: '1px solid #E0E0E0',
                                color: log.startsWith('✅') ? '#2E7D32' : log.startsWith('⏭️') ? '#666' : '#C62828',
                                fontSize: '14px'
                            }}>
                                {log}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
