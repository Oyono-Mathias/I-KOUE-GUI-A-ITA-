import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserData } from '../../hooks/useAuth';
import { 
    Crown, CheckSquare, History, TrendingUp, AlertTriangle, 
    CheckCircle, XCircle, Clock, FileText
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';

export function PresidentDashboard({ currentUser }: { currentUser: UserData }) {
    const [activeTab, setActiveTab] = useState('accueil');
    const [loading, setLoading] = useState(true);

    // Data states
    const [validations, setValidations] = useState<any[]>([]);
    const [finances, setFinances] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        const unsubVals = onSnapshot(query(collection(db, 'validations'), orderBy('createdAt', 'desc')), snap => {
            setValidations(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubFin = onSnapshot(query(collection(db, 'finances'), orderBy('createdAt', 'asc')), snap => {
            setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubVals(); unsubFin(); unsubUsers();
        };
    }, []);

    const handleValidation = async (id: string, status: 'approved' | 'rejected') => {
        if (window.confirm(`Confirmez-vous cette décision (${status === 'approved' ? 'Approuver' : 'Refuser'}) ?`)) {
            await updateDoc(doc(db, 'validations', id), {
                status,
                processedAt: serverTimestamp(),
                processedBy: currentUser.displayName
            });
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement de l'espace Fondateur...</div>;

    const pendingCount = validations.filter(v => v.status === 'pending').length;
    const historyList = validations.filter(v => v.status !== 'pending');
    
    // Aggregating finances for the chart
    const monthlyFinances = finances.reduce((acc, curr) => {
        if (!curr.createdAt) return acc;
        const date = curr.createdAt.toDate();
        const month = `${date.getMonth() + 1}/${date.getFullYear()}`;
        if (!acc[month]) acc[month] = { name: month, solde: 0, recettes: 0, depenses: 0 };
        if (curr.type === 'recette') {
            acc[month].recettes += curr.amount;
            acc[month].solde += curr.amount;
        } else {
            acc[month].depenses += curr.amount;
            acc[month].solde -= curr.amount;
        }
        return acc;
    }, {});
    
    let runningTotal = 0;
    const chartData = Object.values(monthlyFinances).map((m: any) => {
        runningTotal += m.solde;
        return { ...m, cumul: runningTotal };
    });

    // Users stats for BarChart
    const actifs = users.filter(u => u.statut === 'actif').length;
    const suspendus = users.filter(u => u.statut === 'suspendu').length;
    const radies = users.filter(u => u.statut === 'radie').length;
    const membersData = [
        { name: 'Actifs', count: actifs, fill: 'var(--vert-espoir)' },
        { name: 'Suspendus', count: suspendus, fill: 'var(--orange-energie)' },
        { name: 'Radiés', count: radies, fill: 'var(--rouge-solidarite)' }
    ];

    const tabs = [
        { id: 'accueil', label: 'Vue d\'Ensemble', icon: <TrendingUp size={18} /> },
        { id: 'validations', label: `Validations ${pendingCount > 0 ? `(${pendingCount})` : ''}`, icon: <CheckSquare size={18} /> },
        { id: 'historique', label: 'Historique & Archives', icon: <History size={18} /> }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)', padding: '24px', borderRadius: '16px', color: '#000', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Crown size={40} color="#000" />
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px' }}>Espace Président Fondateur</h2>
                    <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontWeight: 'bold', fontSize: '14px' }}>Art. 15 & 17 du RI - Supervision & Validation</p>
                </div>
            </div>

            <div style={{ 
                display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', 
                WebkitOverflowScrolling: 'touch', borderBottom: '1px solid var(--bordure)',
                scrollbarWidth: 'none'
            }}>
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '6px', 
                            padding: '10px 16px', flexShrink: 0,
                            background: activeTab === tab.id ? 'var(--or-solaire)' : 'var(--blanc-pur)', 
                            color: activeTab === tab.id ? '#000' : 'var(--bleu-rca)', 
                            border: '1px solid', borderColor: activeTab === tab.id ? 'var(--or-solaire)' : 'var(--bordure)',
                            borderRadius: '24px', fontWeight: 'bold', cursor: 'pointer',
                            fontSize: '14px', position: 'relative'
                        }}
                    >
                        {tab.icon} {tab.label}
                        {tab.id === 'validations' && pendingCount > 0 && activeTab !== tab.id && (
                            <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--rouge-solidarite)', color: 'white', width: '10px', height: '10px', borderRadius: '50%' }} />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'accueil' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                        <div style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', borderLeft: '4px solid var(--bleu-rca)' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Membres Actifs</p>
                            <h3 style={{ margin: '8px 0 0 0', fontSize: '24px' }}>{actifs}</h3>
                        </div>
                        <div style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', borderLeft: '4px solid var(--vert-espoir)' }}>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Trésorerie Globale</p>
                            <h3 style={{ margin: '8px 0 0 0', fontSize: '20px' }}>{runningTotal.toLocaleString()} FCFA</h3>
                        </div>
                        <div 
                            onClick={() => setActiveTab('validations')}
                            style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', borderLeft: '4px solid var(--orange-energie)', cursor: 'pointer' }}
                        >
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Dossiers en attente</p>
                            <h3 style={{ margin: '8px 0 0 0', fontSize: '24px' }}>{pendingCount}</h3>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                        <div style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                            <h4 style={{ margin: '0 0 16px 0', color: 'var(--bleu-rca)' }}>Évolution de la Trésorerie</h4>
                            {chartData.length > 0 ? (
                                <div style={{ height: '220px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} width={80} />
                                            <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
                                            <Line type="monotone" dataKey="cumul" stroke="var(--vert-espoir)" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p style={{ color: '#666', fontSize: '14px', textAlign: 'center', fontStyle: 'italic', paddingTop: '50px' }}>Données insuffisantes.</p>
                            )}
                        </div>

                        <div style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                            <h4 style={{ margin: '0 0 16px 0', color: 'var(--bleu-rca)' }}>Répartition des Membres</h4>
                            <div style={{ height: '220px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={membersData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'validations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <AlertTriangle color="var(--orange-energie)" style={{ flexShrink: 0 }} />
                        <div>
                            <h4 style={{ margin: '0 0 4px 0', color: 'var(--orange-energie)' }}>Droit de regard (Art. 17)</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Examinez les propositions du Bureau Exécutif (statuts, rapports, PV) avant leur application définitive.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {validations.filter(v => v.status === 'pending').length === 0 ? (
                            <div style={{ padding: '30px 20px', textAlign: 'center', background: 'var(--blanc-pur)', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                                <CheckCircle size={40} color="var(--vert-espoir)" style={{ marginBottom: '16px', opacity: 0.5 }} />
                                <h4 style={{ margin: '0 0 8px 0' }}>Aucun dossier en attente</h4>
                                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Vous avez validé toutes les requêtes du bureau.</p>
                            </div>
                        ) : (
                            validations.filter(v => v.status === 'pending').map(v => (
                                <div key={v.id} style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', borderLeft: '4px solid var(--orange-energie)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', background: '#F5F5F5', padding: '4px 8px', borderRadius: '12px', color: '#666' }}>{v.type.toUpperCase()}</span>
                                        <span style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {v.createdAt ? new Date(v.createdAt.toDate()).toLocaleDateString('fr-FR') : ''}</span>
                                    </div>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{v.title}</h4>
                                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#444' }}>{v.description}</p>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px', background: 'var(--fond-alterne)', padding: '8px', borderRadius: '8px' }}>
                                        Soumis par : <strong>{v.requestedBy}</strong>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleValidation(v.id, 'approved')}
                                            style={{ flex: 1, padding: '12px', background: 'var(--vert-espoir)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                                        ><CheckCircle size={16} /> Approuver</button>
                                        
                                        <button 
                                            onClick={() => handleValidation(v.id, 'rejected')}
                                            style={{ flex: 1, padding: '12px', background: '#FFEBEE', color: 'var(--rouge-solidarite)', border: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                                        ><XCircle size={16} /> Refuser</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'historique' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <h4 style={{ margin: '0', color: 'var(--bleu-rca)' }}>Journal des Validations</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {historyList.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic', margin: 0 }}>Aucun historique disponible.</p>
                        ) : (
                            historyList.map(v => (
                                <div key={v.id} style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', borderLeft: `4px solid ${v.status === 'approved' ? 'var(--vert-espoir)' : 'var(--rouge-solidarite)'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h5 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{v.title}</h5>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Traité le {v.processedAt ? new Date(v.processedAt.toDate()).toLocaleDateString('fr-FR') : 'Date inconnue'} par {v.processedBy}</p>
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', background: v.status === 'approved' ? '#E8F5E9' : '#FFEBEE', color: v.status === 'approved' ? '#2E7D32' : '#C62828' }}>
                                            {v.status === 'approved' ? 'APPROUVÉ' : 'REFUSÉ'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <h4 style={{ margin: '16px 0 0 0', color: 'var(--bleu-rca)' }}>Archives Numériques</h4>
                    <div style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                        <FileText size={24} color="#666" />
                        <div>
                            <h5 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Dossier Légal (Statuts, RI)</h5>
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Accès sécurisé réservé au Fondateur</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
