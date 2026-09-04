const fs = require('fs');
const path = require('path');

// 1. Create src/firebase.ts
const firebaseCode = `
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCXZLTvYx5lIz0SVQQt_fvPdsjAzRszGLI",
  authDomain: "gen-lang-client-0982990158.firebaseapp.com",
  projectId: "gen-lang-client-0982990158",
  storageBucket: "gen-lang-client-0982990158.firebasestorage.app",
  messagingSenderId: "831858291856",
  appId: "1:831858291856:web:7c92487d4ecd308bdcd415"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
`;
fs.writeFileSync('src/firebase.ts', firebaseCode);

// 2. Modify main.ts to use React and export Firebase
let mainTs = fs.readFileSync('src/main.ts', 'utf8');
mainTs = mainTs.replace(/import \{ initializeApp \} from 'firebase\/app';[\s\S]*?const auth = getAuth\(app\);/m, `
import { app, db, auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Education } from './components/Education';
`);

mainTs += `\n
// Rendu du composant React pour la page Éducation
const eduRoot = document.getElementById('react-education-root');
if (eduRoot) {
    createRoot(eduRoot).render(React.createElement(Education));
}
`;
fs.writeFileSync('src/main.ts', mainTs);

// 3. Modify index.html to create a React mount point
let html = fs.readFileSync('index.html', 'utf8');
const eduStart = html.indexOf('<div class="page" id="page-education">');
const eduEnd = html.indexOf('<!-- PAGE SANTÉ -->');
const newEdu = `<div class="page" id="page-education">\n    <div id="react-education-root"></div>\n</div>\n\n        `;
if(eduStart !== -1 && eduEnd !== -1) {
    html = html.substring(0, eduStart) + newEdu + html.substring(eduEnd);
    fs.writeFileSync('index.html', html);
}

// 4. Create global CSS exactly as requested
const cssContent = `
        /* VARIABLES SONT DÉJÀ DANS index.html. AJOUT DES CLASSES SPÉCIFIQUES */
        .stats-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 24px 0; }
        .stat-item { background: var(--blanc-pur); border-radius: 10px; padding: 20px 16px; text-align: center; box-shadow: var(--shadow); border-top: 3px solid var(--orange-energie); }
        .stat-item .number { font-size: 28px; font-weight: 700; color: var(--orange-energie); display: block; }
        .stat-item .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
        .activites-grid { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 24px; }
        .activite-card { background: var(--blanc-pur); border-radius: 16px; padding: 24px; box-shadow: var(--shadow); border-left: 5px solid var(--orange-energie); transition: transform 0.2s; }
        .activite-card:active { transform: scale(0.98); }
        .activite-card .icon { width: 64px; height: 64px; border-radius: 50%; background: #FFF3E0; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; }
        .activite-card h3 { font-size: 18px; color: var(--bleu-rca); margin-bottom: 12px; }
        .activite-card p { font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 12px; }
        .activite-card ul { list-style: none; padding: 0; }
        .activite-card ul li { padding: 6px 0 6px 24px; position: relative; font-size: 13px; line-height: 1.5; }
        .activite-card ul li::before { content: '✓'; position: absolute; left: 0; top: 6px; width: 18px; height: 18px; background: var(--orange-energie); color: var(--blanc-pur); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; }
        .impact-box { background: linear-gradient(135deg, var(--orange-energie) 0%, #FF8F00 100%); border-radius: 16px; padding: 32px 24px; color: var(--blanc-pur); margin: 24px 0; position: relative; overflow: hidden; }
        .impact-box::before { content: '📚'; position: absolute; top: -30px; right: -30px; font-size: 200px; opacity: 0.1; }
        .impact-box h3 { font-size: 22px; color: var(--blanc-pur); margin-bottom: 12px; position: relative; z-index: 1; }
        .impact-box p { font-size: 15px; line-height: 1.7; position: relative; z-index: 1; }
        .temoignages-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 24px; }
        .temoignage-card { background: var(--blanc-pur); border-radius: 12px; padding: 24px; box-shadow: var(--shadow); border-top: 4px solid var(--orange-energie); }
        .temoignage-card .quote { font-style: italic; font-size: 14px; color: #555; line-height: 1.6; margin-bottom: 16px; position: relative; padding-left: 20px; }
        .temoignage-card .quote::before { content: '"'; position: absolute; left: 0; top: -10px; font-size: 40px; color: var(--orange-energie); opacity: 0.3; font-family: Georgia, serif; }
        .temoignage-card .author { display: flex; align-items: center; gap: 12px; }
        .temoignage-card .author-avatar { width: 48px; height: 48px; border-radius: 50%; background: #FFF3E0; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .temoignage-card .author-info h4 { font-size: 14px; color: var(--bleu-rca); margin-bottom: 2px; }
        .temoignage-card .author-info p { font-size: 12px; color: #999; }
        .domaines-nav { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 24px; }
        .domaine-link { background: var(--blanc-pur); border: 2px solid var(--bordure); border-radius: 10px; padding: 12px 8px; text-align: center; text-decoration: none; transition: all 0.2s; cursor:pointer; color: var(--texte-principal); }
        .domaine-link:active { transform: scale(0.95); }
        .domaine-link.active { background: var(--orange-energie); border-color: var(--orange-energie); color: var(--blanc-pur); }
        .domaine-link .icon { font-size: 24px; margin-bottom: 4px; }
        .domaine-link span { font-size: 11px; font-weight: 600; display: block; }
        @media (min-width: 768px) {
            .activites-grid { grid-template-columns: repeat(2, 1fr); }
            .temoignages-grid { grid-template-columns: repeat(2, 1fr); }
            .stats-row { grid-template-columns: repeat(4, 1fr); }
        }
`;
fs.writeFileSync('src/globals.css', cssContent);

// 5. Create Education React Component
if (!fs.existsSync('src/components')) fs.mkdirSync('src/components');
const componentCode = `
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
                            <a key={dom.id} onClick={(e) => { e.preventDefault(); navigateTo(dom.slug); }} className={\`domaine-link \${dom.slug === 'education' ? 'active' : ''}\`}>
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
`;
fs.writeFileSync('src/components/Education.tsx', componentCode);

// 6. Create SQL File (for documentation / rule adherence)
const sqlContent = `
-- SCHÉMA BASE DE DONNÉES TEMPS RÉEL (Compatible Supabase / PostgreSQL)

CREATE TABLE public.stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.activites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon VARCHAR(10),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    liste_points JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.temoignages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote TEXT NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(255),
    author_avatar_emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.domaines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Configuration
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temoignages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique stats" ON public.stats FOR SELECT USING (true);
CREATE POLICY "Lecture publique activites" ON public.activites FOR SELECT USING (true);
CREATE POLICY "Lecture publique temoignages" ON public.temoignages FOR SELECT USING (true);
CREATE POLICY "Lecture publique domaines" ON public.domaines FOR SELECT USING (true);
`;
fs.writeFileSync('supabase.sql', sqlContent);
