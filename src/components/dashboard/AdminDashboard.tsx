import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserData } from '../../hooks/useAuth';
import { 
    Home, Users, Banknote, CalendarDays, Newspaper, FileText, 
    Search, Plus, CheckCircle, AlertTriangle, XCircle, Download, Send 
} from 'lucide-react';

export function AdminDashboard({ currentUser }: { currentUser: UserData }) {
    const [activeTab, setActiveTab] = useState('accueil');
    const [loading, setLoading] = useState(true);

    // Data states
    const [users, setUsers] = useState<UserData[]>([]);
    const [finances, setFinances] = useState<any[]>([]);
    const [agEvents, setAgEvents] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [reports, setReports] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [adhesions, setAdhesions] = useState<any[]>([]);

    // Form states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMember, setNewMember] = useState({ displayName: '', email: '', role: 'membre', phone: '' });

    const [showFinanceForm, setShowFinanceForm] = useState(false);
    const [financeData, setFinanceData] = useState({ type: 'recette', amount: '', description: '' });
    
    const [showAgForm, setShowAgForm] = useState(false);
    const [agData, setAgData] = useState({ title: '', date: '', agenda: '' });

    const [showNewsForm, setShowNewsForm] = useState(false);
    const [newsData, setNewsData] = useState({ title: '', content: '' });

    useEffect(() => {
        // Real-time listeners for all modules
        const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('displayName')), snap => {
            setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserData)));
        });

        const unsubFinances = onSnapshot(query(collection(db, 'finances'), orderBy('createdAt', 'desc')), snap => {
            setFinances(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubAg = onSnapshot(query(collection(db, 'ag_events'), orderBy('createdAt', 'desc')), snap => {
            setAgEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubNews = onSnapshot(query(collection(db, 'actualites'), orderBy('createdAt', 'desc')), snap => {
            setNews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubReports = onSnapshot(query(collection(db, 'rapports_delegues'), orderBy('createdAt', 'desc')), snap => {
            setReports(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubMessages = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc')), snap => {
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubAdhesions = onSnapshot(query(collection(db, 'adhesions'), orderBy('createdAt', 'desc')), snap => {
            setAdhesions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });

        return () => {
            unsubUsers(); unsubFinances(); unsubAg(); unsubNews(); unsubReports(); unsubMessages(); unsubAdhesions();
        };
    }, []);

    // ACTIONS
    const handleRoleChange = async (uid: string, newRole: string) => {
        try {
            await updateDoc(doc(db, 'users', uid), { role: newRole });
            alert('Rôle mis à jour avec succès !');
        } catch (error) {
            console.error("Erreur lors de la mise à jour du rôle:", error);
            alert("Erreur lors de la mise à jour du rôle.");
        }
    };

    const handleStatusChange = async (uid: string, newStatut: string, userName: string) => {
        try {
            if (currentUser.role === 'super_admin') {
                await updateDoc(doc(db, 'users', uid), { statut: newStatut });
                alert(`Statut de ${userName} mis à jour : ${newStatut.toUpperCase()}`);
            } else {
                await addDoc(collection(db, 'validations'), {
                    type: 'bureau',
                    title: `Changement de statut : ${userName}`,
                    description: `Proposition de passer le membre ${userName} en statut : ${newStatut.toUpperCase()}.`,
                    status: 'pending',
                    createdAt: serverTimestamp(),
                    requestedBy: currentUser.displayName || 'Bureau',
                    targetUid: uid,
                    proposedStatus: newStatut
                });
                alert('Demande soumise au Président Fondateur pour validation (Art. 17).');
            }
        } catch (error) {
            console.error("Erreur lors du changement de statut:", error);
            alert("Erreur lors du changement de statut.");
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        try {
            // Empêcher les doublons par email côté client (en attendant les règles Firestore)
            const existingUser = users.find(u => u.email.toLowerCase() === newMember.email.toLowerCase());
            if (existingUser) {
                alert('Un membre avec cet email existe déjà !');
                setIsSubmitting(false);
                return;
            }

            // Création d'un document utilisateur (simulant l'ajout)
            await addDoc(collection(db, 'users'), {
                displayName: newMember.displayName,
                email: newMember.email,
                role: newMember.role,
                phone: newMember.phone,
                statut: 'actif',
                createdAt: serverTimestamp()
            });
            alert('Membre ajouté avec succès !');
            setNewMember({ displayName: '', email: '', role: 'membre', phone: '' });
            setShowAddMember(false);
        } catch (error) {
            console.error("Erreur d'ajout :", error);
            alert("Erreur lors de l'ajout du membre.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddFinance = async (e: React.FormEvent) => {
        e.preventDefault();
        await addDoc(collection(db, 'finances'), {
            ...financeData,
            amount: parseFloat(financeData.amount),
            createdAt: serverTimestamp(),
            createdBy: currentUser.uid
        });
        
        // Also send a validation for the report if it's a big expense
        if (financeData.type === 'depense' && parseFloat(financeData.amount) > 50000) {
            await addDoc(collection(db, 'validations'), {
                type: 'finance',
                title: `Dépense majeure : ${financeData.amount} FCFA`,
                description: `Motif : ${financeData.description}. Rapport financier nécessitant une approbation.`,
                status: 'pending',
                createdAt: serverTimestamp(),
                requestedBy: currentUser.displayName || 'Trésorier',
            });
        }
        
        setFinanceData({ type: 'recette', amount: '', description: '' });
        setShowFinanceForm(false);
    };

    const handleAddAg = async (e: React.FormEvent) => {
        e.preventDefault();
        await addDoc(collection(db, 'ag_events'), {
            ...agData,
            pvText: '',
            createdAt: serverTimestamp()
        });
        
        // Request validation for the Convocation
        await addDoc(collection(db, 'validations'), {
            type: 'ag',
            title: `Convocation : ${agData.title}`,
            description: `Ordre du jour : ${agData.agenda}. Date prévue : ${agData.date}`,
            status: 'pending',
            createdAt: serverTimestamp(),
            requestedBy: currentUser.displayName || 'Secrétariat',
        });
        
        setAgData({ title: '', date: '', agenda: '' });
        setShowAgForm(false);
    };

    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        await addDoc(collection(db, 'actualites'), {
            ...newsData,
            createdAt: serverTimestamp(),
            author: currentUser.displayName
        });
        setNewsData({ title: '', content: '' });
        setShowNewsForm(false);
    };

    const updatePv = async (id: string, pvText: string, agTitle: string) => {
        await updateDoc(doc(db, 'ag_events', id), { pvText });
        // Auto-save silently to avoid disrupting the user's typing
    };
    
    const submitPv = async (id: string, agTitle: string) => {
        try {
            await addDoc(collection(db, 'validations'), {
                type: 'ag',
                title: `Validation PV : ${agTitle}`,
                description: `Le Procès-Verbal a été rédigé et nécessite l'approbation du Fondateur.`,
                status: 'pending',
                createdAt: serverTimestamp(),
                requestedBy: currentUser.displayName || 'Secrétariat',
            });
            alert('PV soumis au Président.');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la soumission");
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Chargement du bureau...</div>;

    // CALCULS STATS
    const totalRecettes = finances.filter(f => f.type === 'recette').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalDepenses = finances.filter(f => f.type === 'depense').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const solde = totalRecettes - totalDepenses;
    const membresEnRetard = users.filter(u => u.statut === 'suspendu').length;

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const tabs = [
        { id: 'accueil', label: 'Accueil', icon: <Home size={18} />, roles: ['all'] },
        { id: 'adhesions', label: 'Nouvelles Adhésions', icon: <Users size={18} />, roles: ['super_admin', 'vice_president', 'admin_bureau', 'conseiller'] },
        { id: 'membres', label: 'Membres', icon: <Users size={18} />, roles: ['super_admin', 'vice_president', 'admin_bureau', 'admin', 'conseiller'] },
        { id: 'roles', label: 'Répartition Rôles', icon: <Users size={18} />, roles: ['super_admin', 'vice_president', 'admin_bureau', 'admin', 'conseiller'] },
        { id: 'finances', label: 'Finances', icon: <Banknote size={18} />, roles: ['super_admin', 'vice_president', 'tresorier', 'admin_bureau', 'admin', 'conseiller'] },
        { id: 'ag', label: 'AG & Réunions', icon: <CalendarDays size={18} />, roles: ['super_admin', 'vice_president', 'admin_bureau', 'admin', 'conseiller'] },
        { id: 'actualites', label: 'Actualités', icon: <Newspaper size={18} />, roles: ['super_admin', 'vice_president', 'communicateur', 'admin_bureau', 'admin'] },
        { id: 'messages', label: 'Messages Publics', icon: <Send size={18} />, roles: ['super_admin', 'communicateur', 'admin_bureau'] },
        { id: 'delegues', label: 'Délégués', icon: <FileText size={18} />, roles: ['super_admin', 'vice_president', 'admin_bureau', 'admin', 'conseiller'] },
    ].filter(t => t.roles.includes('all') || t.roles.includes(currentUser.role));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '90px' }}>
            
            {/* 1. ACCUEIL */}
            {activeTab === 'accueil' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: '#FFF3E0', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--orange-energie)' }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--orange-energie)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} /> Alertes & Notifications
                        </h4>
                        <p style={{ margin: 0, fontSize: '14px' }}>
                            {membresEnRetard > 0 ? `⚠️ ${membresEnRetard} membre(s) en retard de cotisation.` : '✅ Tous les membres sont à jour.'}
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div 
                            onClick={() => setActiveTab('membres')}
                            style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', cursor: 'pointer' }}
                        >
                            <Users size={24} color="var(--bleu-rca)" style={{ marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Membres Actifs</p>
                            <h3 style={{ margin: 0, fontSize: '24px', color: 'var(--texte-principal)' }}>{users.length}</h3>
                        </div>
                        <div 
                            onClick={() => setActiveTab('finances')}
                            style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)', cursor: 'pointer' }}
                        >
                            <Banknote size={24} color="var(--vert-espoir)" style={{ marginBottom: '8px' }} />
                            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Solde Trésorerie</p>
                            <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--texte-principal)' }}>{solde.toLocaleString()} FCFA</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. GESTION DES MEMBRES */}
            {activeTab === 'membres' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: '1 1 200px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: '#666' }} />
                            <input 
                                type="text" 
                                placeholder="Rechercher un membre..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', border: '1px solid var(--bordure)', fontSize: '16px' }}
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--bordure)', fontSize: '16px', flex: '0 1 200px', background: 'white' }}
                        >
                            <option value="all">Tous les rôles</option>
                            <option value="membre">Membres</option>
                            <option value="conseiller">Conseillers</option>
                            <option value="communicateur">Communicateurs</option>
                            <option value="tresorier">Trésoriers</option>
                            <option value="admin_bureau">Secrétaires Généraux</option>
                            <option value="vice_president">Vice-Présidents</option>
                            <option value="super_admin">Président</option>
                        </select>
                        {['super_admin', 'vice_president', 'admin_bureau'].includes(currentUser.role) && (
                            <button 
                                onClick={() => setShowAddMember(!showAddMember)}
                                style={{ padding: '14px 20px', background: 'var(--orange-energie)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                            >
                                <Plus size={18} /> Ajouter
                            </button>
                        )}
                    </div>

                    {showAddMember && (
                        <form onSubmit={handleAddMember} style={{ background: 'var(--blanc-pur)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h4 style={{ margin: '0 0 8px 0', color: 'var(--bleu-rca)' }}>Créer / Ajouter un membre</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Nom complet</label>
                                    <input type="text" required value={newMember.displayName} onChange={e => setNewMember({...newMember, displayName: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Email</label>
                                    <input type="email" required value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Téléphone</label>
                                    <input type="tel" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Rôle initial</label>
                                    <select value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px', background: 'white' }}>
                                        <option value="membre">Membre</option>
                                        <option value="conseiller">Conseiller</option>
                                        <option value="communicateur">Communicateur</option>
                                        <option value="tresorier">Trésorier</option>
                                        <option value="admin_bureau">Secrétaire Général</option>
                                        <option value="vice_president">Vice-Président</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" style={{ padding: '14px', background: 'var(--bleu-rca)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', marginTop: '8px', cursor: 'pointer' }}>
                                Enregistrer le membre
                            </button>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filteredUsers.map(user => (
                            <div key={user.uid} style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{user.displayName || 'Sans nom'}</h4>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{user.email}</p>
                                        {currentUser.role === 'super_admin' ? (
                                            <select 
                                                value={user.role} 
                                                onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                                style={{ marginTop: '8px', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', background: 'var(--fond-alterne)', border: '1px solid var(--bordure)', cursor: 'pointer' }}
                                            >
                                                <option value="membre">MEMBRE</option>
                                                <option value="conseiller">CONSEILLER</option>
                                                <option value="communicateur">COMMUNICATEUR</option>
                                                <option value="tresorier">TRÉSORIER</option>
                                                <option value="admin_bureau">SECRÉTAIRE GÉNÉRAL</option>
                                                <option value="vice_president">VICE-PRÉSIDENT</option>
                                                <option value="super_admin">PRÉSIDENT FONDATEUR</option>
                                            </select>
                                        ) : (
                                            <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '11px', padding: '2px 8px', background: 'var(--fond-alterne)', borderRadius: '12px', fontWeight: 'bold' }}>
                                                {user.role.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ 
                                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                        background: user.statut === 'suspendu' ? '#FFEBEE' : (user.statut === 'radie' ? '#EEEEEE' : '#E8F5E9'),
                                        color: user.statut === 'suspendu' ? '#C62828' : (user.statut === 'radie' ? '#666' : '#2E7D32')
                                    }}>
                                        {user.statut === 'suspendu' ? 'SUSPENDU' : (user.statut === 'radie' ? 'RADIÉ' : 'ACTIF')}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--fond-alterne)', paddingTop: '12px' }}>
                                    <button 
                                        onClick={() => handleStatusChange(user.uid, 'actif', user.displayName || 'Membre')}
                                        style={{ flex: 1, padding: '8px', background: '#E8F5E9', color: '#2E7D32', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    ><CheckCircle size={14} /> Activer</button>
                                    
                                    <button 
                                        onClick={() => handleStatusChange(user.uid, 'suspendu', user.displayName || 'Membre')}
                                        style={{ flex: 1, padding: '8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    ><AlertTriangle size={14} /> Suspendre</button>

                                    <button 
                                        onClick={() => handleStatusChange(user.uid, 'radie', user.displayName || 'Membre')}
                                        style={{ flex: 1, padding: '8px', background: '#F5F5F5', color: '#666', border: 'none', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                    ><XCircle size={14} /> Radier</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 2.5 ROLES & TACHES */}
            {activeTab === 'roles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: 'var(--bleu-rca)', color: 'white', padding: '20px', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Répartition des Rôles (Bureau Exécutif)</h4>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Conformément aux Statuts et au Règlement Intérieur, voici la grille d'attributions des membres du Bureau.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {[
                            { role: 'Président Fondateur', desc: 'Représente l’association. Veille à l\'application des statuts (Art. 17).', color: 'var(--or-solaire)', count: users.filter(u => u.role === 'super_admin').length },
                            { role: 'Vice-Président', desc: 'Assiste le Président et le remplace en cas d\'empêchement.', color: '#9C27B0', count: users.filter(u => u.role === 'vice_president').length },
                            { role: 'Secrétaire Général', desc: 'Rédige les PV, gère les archives et coordonne l\'administration.', color: 'var(--bleu-rca)', count: users.filter(u => u.role === 'admin_bureau').length },
                            { role: 'Trésorier', desc: 'Responsable des fonds, recouvre les cotisations et prépare le bilan.', color: 'var(--vert-espoir)', count: users.filter(u => u.role === 'tresorier').length },
                            { role: 'Communicateur', desc: 'Gère la communication interne et externe (Relations Publiques).', color: 'var(--orange-energie)', count: users.filter(u => u.role === 'communicateur').length },
                            { role: 'Conseillers', desc: 'Assiste le bureau par ses conseils et son expertise.', color: '#607D8B', count: users.filter(u => u.role === 'conseiller').length }
                        ].map((r, i) => (
                            <div key={i} style={{ background: 'var(--blanc-pur)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)', borderTop: `4px solid ${r.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--texte-principal)' }}>{r.role}</h4>
                                    <span style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{r.count} actif(s)</span>
                                </div>
                                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>{r.desc}</p>
                                <button onClick={() => { setActiveTab('membres'); setRoleFilter('all'); }} style={{ width: '100%', padding: '10px', background: 'transparent', border: `1px solid ${r.color}`, color: r.color, borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Gérer les attributions
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 3. FINANCES */}
            {activeTab === 'finances' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <button 
                        onClick={() => setShowFinanceForm(!showFinanceForm)}
                        style={{ padding: '14px', background: 'var(--vert-espoir)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px' }}
                    >
                        {showFinanceForm ? 'Fermer' : <><Plus size={20} /> Nouvelle Transaction</>}
                    </button>

                    {showFinanceForm && (
                        <form onSubmit={handleAddFinance} style={{ background: 'var(--blanc-pur)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Type d'opération</label>
                                <select 
                                    value={financeData.type} onChange={e => setFinanceData({...financeData, type: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', background: 'white', fontSize: '16px' }}
                                >
                                    <option value="recette">Recette (Cotisation / Don)</option>
                                    <option value="depense">Dépense (Achat / Prestation)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Montant (FCFA)</label>
                                <input type="number" required value={financeData.amount} onChange={e => setFinanceData({...financeData, amount: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Motif / Description</label>
                                <input type="text" required value={financeData.description} onChange={e => setFinanceData({...financeData, description: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px' }} />
                            </div>
                            <button type="submit" style={{ padding: '14px', background: 'var(--bleu-rca)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', marginTop: '8px' }}>
                                Enregistrer
                            </button>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ margin: '8px 0', color: 'var(--bleu-rca)' }}>Historique (Art. 16)</h4>
                        {finances.map(f => (
                            <div key={f.id} style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${f.type === 'recette' ? 'var(--vert-espoir)' : 'var(--rouge-solidarite)'}` }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{f.description}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>{f.createdAt ? new Date(f.createdAt.toDate()).toLocaleDateString('fr-FR') : 'Date inconnue'}</p>
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '16px', color: f.type === 'recette' ? 'var(--vert-espoir)' : 'var(--rouge-solidarite)' }}>
                                    {f.type === 'recette' ? '+' : '-'}{f.amount?.toLocaleString()} FCFA
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. AG & REUNIONS */}
            {activeTab === 'ag' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                     <button 
                        onClick={() => setShowAgForm(!showAgForm)}
                        style={{ padding: '14px', background: 'var(--bleu-rca)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px' }}
                    >
                        {showAgForm ? 'Annuler' : <><Plus size={20} /> Convoquer une AG (Art. 6)</>}
                    </button>

                    {showAgForm && (
                        <form onSubmit={handleAddAg} style={{ background: 'var(--blanc-pur)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Titre (ex: AG Ordinaire 2026)</label>
                                <input type="text" required value={agData.title} onChange={e => setAgData({...agData, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Date et Heure</label>
                                <input type="datetime-local" required value={agData.date} onChange={e => setAgData({...agData, date: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px', background: 'white' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Ordre du jour (Art. 7)</label>
                                <textarea required value={agData.agenda} onChange={e => setAgData({...agData, agenda: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px', minHeight: '100px' }} />
                            </div>
                            <button type="submit" style={{ padding: '14px', background: 'var(--orange-energie)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', marginTop: '8px' }}>
                                Diffuser la convocation
                            </button>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {agEvents.map(ag => (
                            <div key={ag.id} style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                                <h4 style={{ margin: '0 0 8px 0', color: 'var(--bleu-rca)', fontSize: '18px' }}>{ag.title}</h4>
                                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>📅 {new Date(ag.date).toLocaleString('fr-FR')}</p>
                                <div style={{ background: 'var(--fond-alterne)', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '12px' }}>
                                    <strong>Ordre du jour:</strong><br/>
                                    {ag.agenda}
                                </div>
                                
                                <textarea 
                                    placeholder="Rédiger le Procès-Verbal (PV) ici..."
                                    defaultValue={ag.pvText}
                                    onBlur={(e) => updatePv(ag.id, e.target.value, ag.title)}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '14px', minHeight: '80px', marginBottom: '8px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <small style={{ color: '#666' }}>Le PV est sauvegardé automatiquement à la sortie du champ texte.</small>
                                    <button 
                                        onClick={() => submitPv(ag.id, ag.title)}
                                        style={{ padding: '6px 12px', background: '#F5F5F5', border: '1px solid var(--bordure)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Soumettre au Président
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. ACTUALITES */}
            {activeTab === 'actualites' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                     <button 
                        onClick={() => setShowNewsForm(!showNewsForm)}
                        style={{ padding: '14px', background: 'var(--orange-energie)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px' }}
                    >
                        {showNewsForm ? 'Annuler' : <><Plus size={20} /> Publier un Article</>}
                    </button>

                    {showNewsForm && (
                        <form onSubmit={handleAddNews} style={{ background: 'var(--blanc-pur)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Titre de l'actualité</label>
                                <input type="text" required value={newsData.title} onChange={e => setNewsData({...newsData, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Contenu</label>
                                <textarea required value={newsData.content} onChange={e => setNewsData({...newsData, content: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--bordure)', fontSize: '16px', minHeight: '120px' }} />
                            </div>
                            <button type="submit" style={{ padding: '14px', background: 'var(--bleu-rca)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', marginTop: '8px' }}>
                                Publier sur le site public
                            </button>
                        </form>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {news.map(n => (
                            <div key={n.id} style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{n.title}</h4>
                                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Publié le {n.createdAt ? new Date(n.createdAt.toDate()).toLocaleDateString('fr-FR') : ''} par {n.author}</p>
                                <p style={{ margin: 0, fontSize: '14px' }}>{n.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 6. RAPPORTS DELEGUES */}
            {activeTab === 'delegues' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: 'var(--bleu-rca)', color: 'white', padding: '16px', borderRadius: '12px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Rapports Terrain (Art. 11 & 12)</h4>
                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Comptes-rendus des délégués préfectoraux et régionaux.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {reports.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666', background: 'var(--blanc-pur)', borderRadius: '12px' }}>
                                Aucun rapport reçu pour le moment.
                            </div>
                        ) : (
                            reports.map(r => (
                                <div key={r.id} style={{ background: 'var(--blanc-pur)', padding: '16px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--orange-energie)' }}>{r.region}</h4>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString('fr-FR') : ''}</span>
                                    </div>
                                    <h5 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{r.title}</h5>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>{r.content}</p>
                                    <div style={{ fontSize: '12px', color: '#666', borderTop: '1px solid var(--bordure)', paddingTop: '8px' }}>
                                        Soumis par: <strong>{r.author}</strong>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ADHESIONS */}
            {activeTab === 'adhesions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: 'var(--blanc-pur)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                        <h4 style={{ margin: '0 0 16px 0', color: 'var(--bleu-rca)' }}>Nouvelles demandes d'adhésion</h4>
                        {adhesions.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>Aucune demande en attente.</p>
                        ) : (
                            adhesions.map(a => (
                                <div key={a.id} style={{ borderBottom: '1px solid var(--bordure)', paddingBottom: '16px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h5 style={{ margin: '0 0 4px 0' }}>{a.nom}</h5>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{a.createdAt ? new Date(a.createdAt.toDate()).toLocaleDateString('fr-FR') : ''}</span>
                                    </div>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Email:</strong> {a.email}</p>
                                    <p style={{ margin: '0 0 4px 0', fontSize: '14px' }}><strong>Tél:</strong> {a.telephone}</p>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}><strong>Motivation:</strong> {a.motivation}</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button style={{ flex: 1, padding: '8px', background: '#E8F5E9', color: '#2E7D32', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Accepter</button>
                                        <button style={{ flex: 1, padding: '8px', background: '#FFEBEE', color: '#C62828', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Refuser</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* MESSAGES PUBLICS */}
            {activeTab === 'messages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
                    <div style={{ background: 'var(--blanc-pur)', padding: '20px', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
                        <h4 style={{ margin: '0 0 16px 0', color: 'var(--bleu-rca)' }}>Messages du site public</h4>
                        {messages.length === 0 ? (
                            <p style={{ color: '#666', fontStyle: 'italic' }}>Aucun message reçu.</p>
                        ) : (
                            messages.map(m => (
                                <div key={m.id} style={{ borderBottom: '1px solid var(--bordure)', paddingBottom: '16px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <h5 style={{ margin: '0 0 4px 0' }}>{m.nom} ({m.sujet})</h5>
                                        <span style={{ fontSize: '12px', color: '#666' }}>{m.createdAt ? new Date(m.createdAt.toDate()).toLocaleDateString('fr-FR') : ''}</span>
                                    </div>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}><strong>Contact:</strong> {m.email} | {m.telephone}</p>
                                    <p style={{ margin: '0', fontSize: '14px', background: '#f9f9f9', padding: '12px', borderRadius: '8px' }}>{m.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* FIXED BOTTOM NAVIGATION BAR FOR MOBILE */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--blanc-pur)',
                display: 'flex',
                overflowX: 'auto',
                gap: '4px',
                padding: '10px 8px',
                borderTop: '1px solid var(--bordure)',
                boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
                zIndex: 1000,
                paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                justifyContent: tabs.length > 4 ? 'flex-start' : 'space-around'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            background: 'transparent',
                            color: activeTab === tab.id ? 'var(--bleu-rca)' : '#888',
                            border: 'none',
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            cursor: 'pointer',
                            minWidth: tabs.length > 4 ? '76px' : 'auto',
                            flex: tabs.length > 4 ? '0 0 auto' : '1',
                            padding: '4px'
                        }}
                    >
                        {React.cloneElement(tab.icon as React.ReactElement, { 
                            color: activeTab === tab.id ? 'var(--bleu-rca)' : '#888', 
                            size: 24 
                        })}
                        <span style={{ fontSize: '11px', marginTop: '2px', whiteSpace: 'nowrap' }}>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
