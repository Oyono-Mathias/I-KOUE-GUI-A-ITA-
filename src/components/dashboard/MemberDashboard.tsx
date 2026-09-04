import React, { useState, useEffect } from 'react';
import { Home, IdCard, CreditCard, FileText, User as UserIcon, QrCode, Download, ExternalLink, Settings, Bell } from 'lucide-react';
import { UserData } from '../../hooks/useAuth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';

interface MemberDashboardProps {
    userData: UserData;
}

export function MemberDashboard({ userData }: MemberDashboardProps) {
    const [activeTab, setActiveTab] = useState('accueil');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.includes('/carte')) setActiveTab('carte');
        else if (path.includes('/cotisations')) setActiveTab('cotisations');
        else if (path.includes('/documents')) setActiveTab('documents');
        else if (path.includes('/profil')) setActiveTab('profil');
        else setActiveTab('accueil');
    }, []);

    useEffect(() => {
        // Fetch Real-time Notifications
        const qNotifs = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(5));
        const unsubNotifs = onSnapshot(qNotifs, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Fetch Real-time Documents
        const qDocs = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
        const unsubDocs = onSnapshot(qDocs, (snap) => {
            setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubNotifs();
            unsubDocs();
        };
    }, []);

    const changeTab = (tab: string) => {
        setActiveTab(tab);
        window.history.pushState({}, '', `/dashboard-membre/${tab}`);
    };

    const tabs = [
        { id: 'accueil', label: 'Accueil', icon: <Home size={20} /> },
        { id: 'carte', label: 'Ma Carte', icon: <IdCard size={20} /> },
        { id: 'cotisations', label: 'Mes Cotisations', icon: <CreditCard size={20} /> },
        { id: 'documents', label: 'Documents & AG', icon: <FileText size={20} /> },
        { id: 'profil', label: 'Mon Profil', icon: <UserIcon size={20} /> },
    ];

    const isAjour = userData.statut === 'actif'; // Simplify status

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '24px', borderBottom: '1px solid var(--bordure)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => changeTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            background: activeTab === tab.id ? 'var(--orange-energie)' : 'var(--blanc-pur)',
                            color: activeTab === tab.id ? 'white' : 'var(--bleu-rca)',
                            border: '1px solid',
                            borderColor: activeTab === tab.id ? 'var(--orange-energie)' : 'var(--bordure)',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1 }}>
                {activeTab === 'accueil' && (
                    <div className="tab-content" style={{ animation: 'fadeIn 0.3s' }}>
                        <h2 style={{ color: 'var(--bleu-rca)', marginBottom: '8px' }}>👋 Bonjour {userData.displayName || 'Membre'} !</h2>
                        
                        {isAjour ? (
                            <div style={{ display: 'inline-block', padding: '6px 12px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', marginBottom: '24px' }}>
                                ✅ Membre Actif - Cotisation à jour
                            </div>
                        ) : (
                            <div style={{ display: 'inline-block', padding: '6px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', marginBottom: '24px' }}>
                                ⚠️ Compte suspendu ou cotisation en attente
                            </div>
                        )}
                        
                        <div style={{ background: 'var(--blanc-pur)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow)', borderLeft: '4px solid var(--orange-energie)' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                                <Bell size={20} color="var(--orange-energie)" /> Notifications Récentes
                            </h3>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: '16px' }}>
                                {notifications.length === 0 ? (
                                    <p style={{ color: '#666', fontStyle: 'italic' }}>Aucune notification pour le moment.</p>
                                ) : (
                                    notifications.map(notif => (
                                        <li key={notif.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--bordure)' }}>
                                            <strong style={{ color: 'var(--bleu-rca)' }}>{notif.title}</strong>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>{notif.content}</p>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'carte' && (
                    <div className="tab-content" style={{ animation: 'fadeIn 0.3s', maxWidth: '400px', margin: '0 auto' }}>
                        <div style={{ background: 'linear-gradient(135deg, var(--bleu-rca), #1a365d)', padding: '24px', borderRadius: '16px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                                <IdCard size={150} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--or-solaire)' }}>I KOUE GUI A ITA</h3>
                                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Carte de Membre Officielle</p>
                                </div>
                                <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <QrCode size={24} color="var(--bleu-rca)" />
                                </div>
                            </div>
                            
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>Nom du membre</p>
                                <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', textTransform: 'uppercase' }}>{userData.displayName || 'Non renseigné'}</h2>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>N° Membre</p>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>IK-{userData.uid.substring(0, 6).toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', opacity: 0.8 }}>Catégorie</p>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{userData.role === 'membre' ? 'Membre Actif' : 'Bureau Exécutif'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button onClick={() => alert("La génération du PDF officiel est en cours d'intégration.")} style={{ flex: 1, padding: '12px', background: 'var(--blanc-pur)', border: '1px solid var(--bordure)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                <Download size={18} /> PDF
                            </button>
                            <button onClick={() => alert("Pour ajouter à l'écran : utilisez le menu de votre navigateur (Partager > Ajouter à l'écran d'accueil).")} style={{ flex: 2, padding: '12px', background: 'var(--orange-energie)', color: 'white', border: 'none', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                <ExternalLink size={18} /> Ajouter à l'écran
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'cotisations' && (
                    <div className="tab-content" style={{ animation: 'fadeIn 0.3s' }}>
                        <div style={{ background: 'var(--blanc-pur)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow)', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--bleu-rca)' }}>Statut Actuel</h3>
                                    {isAjour ? (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#E8F5E9', color: '#2E7D32', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                                            <div style={{ width: '8px', height: '8px', background: '#2E7D32', borderRadius: '50%' }}></div>
                                            À Jour
                                        </div>
                                    ) : (
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#FFEBEE', color: '#C62828', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                                            <div style={{ width: '8px', height: '8px', background: '#C62828', borderRadius: '50%' }}></div>
                                            Cotisation requise
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => alert("L'intégration de la passerelle de paiement (ex: Mobile Money, Carte) est prévue pour une prochaine étape.")} style={{ padding: '12px 24px', background: 'var(--orange-energie)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Payer ma cotisation
                                </button>
                            </div>
                        </div>

                        <h3 style={{ color: 'var(--bleu-rca)', marginBottom: '16px' }}>Historique des paiements</h3>
                        <div style={{ background: 'var(--blanc-pur)', borderRadius: '12px', boxShadow: 'var(--shadow)', overflow: 'hidden', padding: '24px', textAlign: 'center' }}>
                            <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>Aucun historique de paiement récent trouvé.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="tab-content" style={{ animation: 'fadeIn 0.3s' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <div style={{ background: 'var(--blanc-pur)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                                <h3 style={{ color: 'var(--bleu-rca)', marginTop: 0, borderBottom: '2px solid var(--fond-alterne)', paddingBottom: '12px' }}>Convocations & AG</h3>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {documents.filter(d => d.category === 'AG').length === 0 ? (
                                        <p style={{ color: '#666', fontStyle: 'italic', marginTop: '16px' }}>Aucun document disponible.</p>
                                    ) : (
                                        documents.filter(d => d.category === 'AG').map(doc => (
                                            <li key={doc.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--bordure)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{doc.title}</span>
                                                <a href="#" style={{ color: 'var(--orange-energie)' }}><Download size={18} /></a>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                            
                            <div style={{ background: 'var(--blanc-pur)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                                <h3 style={{ color: 'var(--bleu-rca)', marginTop: 0, borderBottom: '2px solid var(--fond-alterne)', paddingBottom: '12px' }}>Rapports Internes</h3>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {documents.filter(d => d.category === 'Rapport').length === 0 ? (
                                        <p style={{ color: '#666', fontStyle: 'italic', marginTop: '16px' }}>Aucun rapport disponible.</p>
                                    ) : (
                                        documents.filter(d => d.category === 'Rapport').map(doc => (
                                            <li key={doc.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--bordure)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span>{doc.title}</span>
                                                <a href="#" style={{ color: 'var(--orange-energie)' }}><Download size={18} /></a>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profil' && (
                    <div className="tab-content" style={{ animation: 'fadeIn 0.3s', maxWidth: '600px' }}>
                        <div style={{ background: 'var(--blanc-pur)', padding: '24px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                            <h3 style={{ color: 'var(--bleu-rca)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} /> Paramètres du compte
                            </h3>
                            
                            <form style={{ marginTop: '24px' }}>
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Nom complet</label>
                                    <input type="text" defaultValue={userData.displayName || ''} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)' }} />
                                </div>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Adresse Email</label>
                                    <input type="email" defaultValue={userData.email || ''} readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', background: 'var(--fond-alterne)', color: '#666' }} />
                                    <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>L'email ne peut pas être modifié.</small>
                                </div>
                                
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>Numéro de téléphone</label>
                                    <input type="tel" placeholder="+236 XX XX XX XX" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)' }} />
                                </div>
                                
                                <button type="button" onClick={() => alert("Mise à jour du profil simulée avec succès. (Base de données en attente de liaison)")} style={{ padding: '12px 24px', background: 'var(--bleu-rca)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Mettre à jour mon profil
                                </button>
                            </form>
                            
                            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--bordure)' }}>
                                <h4 style={{ margin: '0 0 16px 0' }}>Sécurité</h4>
                                <button type="button" onClick={() => alert("Un email de réinitialisation vous sera envoyé. (Fonctionnalité Firebase Auth en cours)")} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--rouge-solidarite)', border: '1px solid var(--rouge-solidarite)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Changer de mot de passe
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
