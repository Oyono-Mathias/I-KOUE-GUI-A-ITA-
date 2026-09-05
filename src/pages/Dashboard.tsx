import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/Dashboard.css';
import { MemberDashboard } from '../components/dashboard/MemberDashboard';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { PresidentDashboard } from '../components/dashboard/PresidentDashboard';
import { LogOut, User, Shield, Crown, Globe } from 'lucide-react';

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
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--bleu-rca)', gap: '12px' }}>
                <div style={{ width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTopColor: 'var(--bleu-rca)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>Chargement sécurisé...</p>
            </div>
        );
    }

    const role = userData.role;

    const handleLogout = () => {
        document.body.classList.remove('user-connected');
        document.body.classList.remove('on-dashboard');
        signOut(auth).then(() => {
            window.location.href = '/login';
        });
    };

    const getRoleLabel = () => {
        switch (role) {
            case 'super_admin': return 'Président Fondateur';
            case 'vice_president': return 'Vice-Président';
            case 'admin_bureau': return 'Secrétaire Général';
            case 'tresorier': return 'Trésorier';
            case 'communicateur': return 'Communicateur';
            case 'conseiller': return 'Conseiller';
            default: return 'Membre';
        }
    };

    const hasMultiSpaces = role !== 'membre';

    return (
        <div className="page active" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            {/* EN-TÊTE ÉLÉGANT, ULTRA-COMPACT ET DÉSATURÉ */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 999,
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}>
                {/* Ligne principale compacte */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    gap: '8px'
                }}>
                    {/* Profil & Titre discret */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'var(--bleu-rca)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '12px',
                            border: '1.5px solid var(--or-solaire)',
                            flexShrink: 0
                        }}>
                            IK
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bleu-rca)', whiteSpace: 'nowrap' }}>
                                    {view === 'fondateur' ? 'Présidence' : view === 'admin' ? 'Bureau Exécutif' : 'Espace Membre'}
                                </span>
                                <span style={{
                                    fontSize: '10px',
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    background: view === 'fondateur' ? '#FEF3C7' : view === 'admin' ? '#E0F2FE' : '#F1F5F9',
                                    color: view === 'fondateur' ? '#92400E' : view === 'admin' ? '#0369A1' : '#475569',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                }}>
                                    {getRoleLabel()}
                                </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {userData.displayName || userData.email}
                            </span>
                        </div>
                    </div>

                    {/* Actions compactes */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button 
                            onClick={() => window.showPage('accueil')}
                            title="Voir le site public"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                color: '#475569',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                        >
                            <Globe size={13} color="#475569" />
                            <span style={{ whiteSpace: 'nowrap' }}>Site</span>
                        </button>
                        <button 
                            onClick={handleLogout}
                            title="Se déconnecter"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                padding: '5px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <LogOut size={13} color="#DC2626" />
                            <span style={{ whiteSpace: 'nowrap' }}>Quitter</span>
                        </button>
                    </div>
                </div>

                {/* Sélecteur d'espace Segmenté compact (uniquement si haut responsable) */}
                {hasMultiSpaces && (
                    <div style={{
                        display: 'flex',
                        background: '#F1F5F9',
                        padding: '3px',
                        borderRadius: '8px',
                        margin: '0 10px 8px 10px',
                        gap: '2px'
                    }}>
                        <button
                            onClick={() => setView('member')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                padding: '5px 6px',
                                border: 'none',
                                borderRadius: '6px',
                                background: view === 'member' ? '#FFFFFF' : 'transparent',
                                color: view === 'member' ? 'var(--bleu-rca)' : '#64748B',
                                fontWeight: view === 'member' ? 700 : 500,
                                fontSize: '11px',
                                boxShadow: view === 'member' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <User size={12} />
                            <span>Membre</span>
                        </button>

                        <button
                            onClick={() => setView('admin')}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                padding: '5px 6px',
                                border: 'none',
                                borderRadius: '6px',
                                background: view === 'admin' ? '#FFFFFF' : 'transparent',
                                color: view === 'admin' ? 'var(--bleu-rca)' : '#64748B',
                                fontWeight: view === 'admin' ? 700 : 500,
                                fontSize: '11px',
                                boxShadow: view === 'admin' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <Shield size={12} />
                            <span>Bureau</span>
                        </button>

                        {role === 'super_admin' && (
                            <button
                                onClick={() => setView('fondateur')}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    padding: '5px 6px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    background: view === 'fondateur' ? '#FFFFFF' : 'transparent',
                                    color: view === 'fondateur' ? '#B8860B' : '#64748B',
                                    fontWeight: view === 'fondateur' ? 700 : 500,
                                    fontSize: '11px',
                                    boxShadow: view === 'fondateur' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <Crown size={12} />
                                <span>Présidence</span>
                            </button>
                        )}
                    </div>
                )}
            </header>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '12px 10px 40px 10px' }}>
                {view === 'member' && <MemberDashboard userData={userData} />}
                {view === 'admin' && <AdminDashboard currentUser={userData} />}
                {view === 'fondateur' && <PresidentDashboard currentUser={userData} />}
            </div>
        </div>
    );
}
