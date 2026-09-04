import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import '../styles/Dashboard.css';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { PresidentDashboard } from '../components/dashboard/PresidentDashboard';

export default function Dashboard() {
    const { userData, loading: authLoading } = useAuth();
    const [view, setView] = useState<'admin' | 'member' | 'fondateur'>('member');

    useEffect(() => {
        if (userData) {
            if (userData.role === 'super_admin') {
                setView('fondateur');
            } else if (userData.role !== 'membre') {
                setView('admin');
            } else {
                setView('member');
            }
        }
    }, [userData]);

    if (authLoading || !userData) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--bleu-rca)' }}>⏳ Chargement du tableau de bord...</div>;
    }

    const role = userData.role;

    const handleLogout = () => {
        signOut(auth).then(() => {
            window.location.href = '/login';
        });
    };

    const getTitle = () => {
        if (view === 'fondateur') return 'ESPACE PRÉSIDENT FONDATEUR';
        if (view === 'admin') return `PORTAIL ${role.toUpperCase().replace('_', ' ')}`;
        return 'ESPACE MEMBRE';
    };

    return (
        <div className="page active" style={{ minHeight: '100vh', background: 'var(--fond-alterne)' }}>
            <header className="header" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="logo-container">
                        <div className="logo">IK</div>
                        <div className="logo-text">
                            <h1>{getTitle()}</h1>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        style={{ background: 'transparent', border: '1px solid var(--or-solaire)', color: 'var(--or-solaire)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Déconnexion
                    </button>
                </div>
                
                {/* Navigation des espaces pour les hauts responsables */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                    <button 
                        onClick={() => setView('member')}
                        style={{ flexShrink: 0, background: view === 'member' ? 'var(--bleu-rca)' : 'var(--blanc-pur)', color: view === 'member' ? 'white' : 'var(--bleu-rca)', border: '1px solid var(--bordure)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                    >
                        👤 Mon Espace Membre
                    </button>
                    {role !== 'membre' && (
                        <button 
                            onClick={() => setView('admin')}
                            style={{ flexShrink: 0, background: view === 'admin' ? 'var(--bleu-rca)' : 'var(--blanc-pur)', color: view === 'admin' ? 'white' : 'var(--bleu-rca)', border: '1px solid var(--bordure)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                        >
                            ⚙️ Bureau Exécutif
                        </button>
                    )}
                    {role === 'super_admin' && (
                        <button 
                            onClick={() => setView('fondateur')}
                            style={{ flexShrink: 0, background: view === 'fondateur' ? 'var(--or-solaire)' : 'var(--blanc-pur)', color: view === 'fondateur' ? '#000' : 'var(--or-solaire)', border: '1px solid', borderColor: view === 'fondateur' ? 'var(--or-solaire)' : 'var(--bordure)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                        >
                            👑 Président Fondateur
                        </button>
                    )}
                </div>
            </header>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 12px 40px 12px' }}>
                {view === 'member' && <MemberDashboard userData={userData} />}
                {view === 'admin' && <AdminDashboard currentUser={userData} />}
                {view === 'fondateur' && <PresidentDashboard currentUser={userData} />}
            </div>
        </div>
    );
}
