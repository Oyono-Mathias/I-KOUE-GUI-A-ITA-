
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import '../globals.css';

export function Education() {
    const [stats, setStats] = useState<any[]>([]);
    const [activites, setActivites] = useState<any[]>([]);
    const [temoignages, setTemoignages] = useState<any[]>([]);
    const [domaines, setDomaines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubStats = onSnapshot(collection(db, 'stats'), (snap) => setStats(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubAct = onSnapshot(collection(db, 'activites'), (snap) => setActivites(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubTem = onSnapshot(collection(db, 'temoignages'), (snap) => setTemoignages(snap.docs.map(d => ({id: d.id, ...d.data()}))));
        const unsubDom = onSnapshot(collection(db, 'domaines'), (snap) => {
            setDomaines(snap.docs.map(d => ({id: d.id, ...d.data()})));
            setLoading(false);
        });
        return () => { unsubStats(); unsubAct(); unsubTem(); unsubDom(); };
    }, []);

    const navigateTo = (page: string) => {
        if((window as any).showPage) (window as any).showPage(page);
    };

    return (
        <div className="react-education-wrapper">
            <div className="page-header" style={{ background: 'linear-gradient(135deg, var(--orange-energie) 0%, #FF8F00 100%)' }}>
                <span className="badge-legal" style={{ background: 'var(--bleu-rca)', color: 'var(--or-solaire)' }}>Article 7.1 des Statuts</span>
                <h2>📚 Éducation</h2>
                <p>L'éducation est la clé du développement durable. Nous œuvrons pour garantir l'accès à l'éducation et à la formation pour tous les Centrafricains.</p>
            </div>

            <div className="breadcrumb">
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('accueil'); }}>Accueil</a> / <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('domaines'); }}>Domaines</a> / <strong>Éducation</strong>
            </div>

            {/* STATS */}
            <section className="section">
                {stats.length === 0 ? (
                    <div style={{ padding: '20px', background: '#F5F7FA', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
                        <div className="skeleton">En attente des données en temps réel...</div>
                    </div>
                ) : (
                    <div className="stats-row">
                        {stats.map(stat => (
                            <div key={stat.id} className="stat-item">
                                <span className="number">{stat.number}</span>
                                <span className="label">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* INTRODUCTION */}
            <section className="section section-alt">
                <h2 className="section-title">Notre Mission Éducative</h2>
                <p className="section-subtitle">Conformément à l'Article 7.1 des Statuts</p>
                <div className="content-block" style={{ padding: 0 }}>
                    <p>L'<strong>éducation</strong> est au cœur de notre mission. Nous croyons fermement que chaque enfant, chaque jeune et chaque adulte mérite d'avoir accès à une éducation de qualité, quel que soit son origine sociale ou sa situation géographique.</p>
                    <p>En République Centrafricaine, où le taux de scolarisation reste faible et où de nombreuses écoles ont été détruites ou fermées à cause des conflits, notre association s'engage à <strong>combler les lacunes éducatives</strong> et à offrir des opportunités d'apprentissage à tous.</p>
                    <p>Nos actions éducatives s'articulent autour de <strong>5 axes principaux</strong> définis par nos Statuts, chacun visant à renforcer les capacités des individus et des communautés.</p>
                </div>
            </section>

            {/* ACTIVITÉS */}
            <section className="section">
                <h2 className="section-title">Nos Activités Éducatives</h2>
                <p className="section-subtitle">Des programmes concrets pour un impact durable</p>
                {activites.length === 0 ? (
                    <div style={{ padding: '20px', background: '#F5F7FA', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
                        <div className="skeleton">En attente des données en temps réel...</div>
                    </div>
                ) : (
                    <div className="activites-grid">
                        {activites.map(act => (
                            <div key={act.id} className="activite-card">
                                <div className="icon">{act.icon}</div>
                                <h3>{act.title}</h3>
                                <p>{act.description}</p>
                                <ul>
                                    {act.liste_points?.map((pt: string, i: number) => (
                                        <li key={i}>{pt}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* IMPACT */}
            <section className="section section-alt">
                <div className="impact-box">
                    <h3>🌟 Notre Impact en Chiffres</h3>
                    <p>Depuis notre création, nous avons touché directement plus de <strong>500 bénéficiaires</strong> dans le domaine de l'éducation. Nos programmes d'alphabétisation ont permis à <strong>80 adultes</strong> de lire et écrire pour la première fois. Nos distributions de kits scolaires ont soutenu <strong>200 enfants</strong> dans leur scolarité. Nous avons réhabilité <strong>5 écoles</strong> dans le 8ème arrondissement de Bangui, offrant un environnement d'apprentissage décent à plus de <strong>300 élèves</strong>.</p>
                </div>
            </section>

            {/* TÉMOIGNAGES */}
            <section className="section">
                <h2 className="section-title">Témoignages</h2>
                <p className="section-subtitle">Ce que disent nos bénéficiaires</p>
                {temoignages.length === 0 ? (
                    <div style={{ padding: '20px', background: '#F5F7FA', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
                        <div className="skeleton">En attente des données en temps réel...</div>
                    </div>
                ) : (
                    <div className="temoignages-grid">
                        {temoignages.map(tem => (
                            <div key={tem.id} className="temoignage-card">
                                <div className="quote">{tem.quote}</div>
                                <div className="author">
                                    <div className="author-avatar">{tem.author_avatar_emoji}</div>
                                    <div className="author-info">
                                        <h4>{tem.author_name}</h4>
                                        <p>{tem.author_role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* NAVIGATION DOMAINES */}
            <section className="section section-alt">
                <h2 className="section-title">Découvrez Nos Autres Domaines</h2>
                <p className="section-subtitle">Une approche multidimensionnelle du développement</p>
                {domaines.length === 0 ? (
                    <div className="domaines-nav">
                        <a onClick={(e) => { e.preventDefault(); navigateTo('sante'); }} className="domaine-link">
                            <div className="icon">🏥</div><span>Santé</span>
                        </a>
                        <a onClick={(e) => { e.preventDefault(); navigateTo('agriculture'); }} className="domaine-link">
                            <div className="icon">🌱</div><span>Agriculture</span>
                        </a>
                        <a onClick={(e) => { e.preventDefault(); navigateTo('juridique'); }} className="domaine-link">
                            <div className="icon">⚖️</div><span>Juridique</span>
                        </a>
                    </div>
                ) : (
                    <div className="domaines-nav">
                        {domaines.filter((d: any) => d.is_active).map((dom: any) => (
                            <a key={dom.id} onClick={(e) => { e.preventDefault(); navigateTo(dom.slug); }} className={`domaine-link ${dom.slug === 'education' ? 'active' : ''}`}>
                                <div className="icon">{dom.icon}</div>
                                <span>{dom.name}</span>
                            </a>
                        ))}
                    </div>
                )}
            </section>

            {/* CTA */}
            <section className="cta-section">
                <h2>Soutenez nos actions éducatives</h2>
                <p>Votre don permet de financer des kits scolaires, de réhabiliter des écoles et de former des enseignants bénévoles</p>
                <div className="hero-buttons">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('soutenir'); }} className="btn btn-primary">💛 FAIRE UN DON</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('contact'); }} className="btn btn-secondary">📞 NOUS CONTACTER</a>
                </div>
            </section>
        </div>
    );
}
