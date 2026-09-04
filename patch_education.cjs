const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const css = `
        /* PAGE EDUCATION SPECIFIC */
        #page-education .stats-row {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin: 24px 0;
        }
        #page-education .stat-item {
            background: var(--blanc-pur);
            border-radius: 10px;
            padding: 20px 16px;
            text-align: center;
            box-shadow: var(--shadow);
            border-top: 3px solid var(--orange-energie);
        }
        #page-education .stat-item .number {
            font-size: 28px;
            font-weight: 700;
            color: var(--orange-energie);
            display: block;
        }
        #page-education .stat-item .label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
        }

        #page-education .activites-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 20px;
            margin-top: 24px;
        }
        #page-education .activite-card {
            background: var(--blanc-pur);
            border-radius: 16px;
            padding: 24px;
            box-shadow: var(--shadow);
            border-left: 5px solid var(--orange-energie);
            transition: transform 0.2s;
        }
        #page-education .activite-card:active {
            transform: scale(0.98);
        }
        #page-education .activite-card .icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #FFF3E0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            margin-bottom: 16px;
        }
        #page-education .activite-card h3 {
            font-size: 18px;
            color: var(--bleu-rca);
            margin-bottom: 12px;
        }
        #page-education .activite-card p {
            font-size: 14px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 12px;
        }
        #page-education .activite-card ul {
            list-style: none;
            padding: 0;
        }
        #page-education .activite-card ul li {
            padding: 6px 0 6px 24px;
            position: relative;
            font-size: 13px;
            line-height: 1.5;
        }
        #page-education .activite-card ul li::before {
            content: '✓';
            position: absolute;
            left: 0;
            top: 6px;
            width: 18px;
            height: 18px;
            background: var(--orange-energie);
            color: var(--blanc-pur);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
        }

        #page-education .impact-box {
            background: linear-gradient(135deg, var(--orange-energie) 0%, #FF8F00 100%);
            border-radius: 16px;
            padding: 32px 24px;
            color: var(--blanc-pur);
            margin: 24px 0;
            position: relative;
            overflow: hidden;
        }
        #page-education .impact-box::before {
            content: '📚';
            position: absolute;
            top: -30px;
            right: -30px;
            font-size: 200px;
            opacity: 0.1;
        }
        #page-education .impact-box h3 {
            font-size: 22px;
            color: var(--blanc-pur);
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
        }
        #page-education .impact-box p {
            font-size: 15px;
            line-height: 1.7;
            position: relative;
            z-index: 1;
        }

        #page-education .temoignages-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin-top: 24px;
        }
        #page-education .temoignage-card {
            background: var(--blanc-pur);
            border-radius: 12px;
            padding: 24px;
            box-shadow: var(--shadow);
            border-top: 4px solid var(--orange-energie);
        }
        #page-education .temoignage-card .quote {
            font-style: italic;
            font-size: 14px;
            color: #555;
            line-height: 1.6;
            margin-bottom: 16px;
            position: relative;
            padding-left: 20px;
        }
        #page-education .temoignage-card .quote::before {
            content: '"';
            position: absolute;
            left: 0;
            top: -10px;
            font-size: 40px;
            color: var(--orange-energie);
            opacity: 0.3;
            font-family: Georgia, serif;
        }
        #page-education .temoignage-card .author {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        #page-education .temoignage-card .author-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: #FFF3E0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        #page-education .temoignage-card .author-info h4 {
            font-size: 14px;
            color: var(--bleu-rca);
            margin-bottom: 2px;
        }
        #page-education .temoignage-card .author-info p {
            font-size: 12px;
            color: #999;
        }
        #page-education .domaines-nav {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 24px;
        }
        #page-education .domaine-link {
            background: var(--blanc-pur);
            border: 2px solid var(--bordure);
            border-radius: 10px;
            padding: 12px 8px;
            text-align: center;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
            color: var(--texte-principal);
        }
        #page-education .domaine-link:active {
            transform: scale(0.95);
        }
        #page-education .domaine-link.active {
            background: var(--orange-energie);
            border-color: var(--orange-energie);
            color: var(--blanc-pur);
        }
        #page-education .domaine-link .icon {
            font-size: 24px;
            margin-bottom: 4px;
        }
        #page-education .domaine-link span {
            font-size: 11px;
            font-weight: 600;
            display: block;
        }

        @media (min-width: 768px) {
            #page-education .activites-grid { grid-template-columns: repeat(2, 1fr); }
            #page-education .temoignages-grid { grid-template-columns: repeat(2, 1fr); }
            #page-education .stats-row { grid-template-columns: repeat(4, 1fr); }
        }
`;

html = html.replace('/* MEDIA QUERIES GLOBALES */', css + '\n        /* MEDIA QUERIES GLOBALES */');

const oldEducationPage = html.substring(
    html.indexOf('<div class="page" id="page-education">'),
    html.indexOf('<!-- PAGE SANTÉ -->')
);

const newEducationPage = `        <div class="page" id="page-education">
    <div class="page-header" style="background: linear-gradient(135deg, var(--orange-energie) 0%, #FF8F00 100%);">
        <span class="badge-legal" style="background: var(--bleu-rca); color: var(--or-solaire);">Article 7.1 des Statuts</span>
        <h2>📚 Éducation</h2>
        <p>L'éducation est la clé du développement durable. Nous œuvrons pour garantir l'accès à l'éducation et à la formation pour tous les Centrafricains.</p>
    </div>

    <div class="breadcrumb">
        <a href="#" onclick="window.showPage('accueil')">Accueil</a> / <a href="#" onclick="window.showPage('domaines')">Domaines</a> / <strong>Éducation</strong>
    </div>

    <!-- STATS -->
    <section class="section">
        <div class="stats-row">
            <div class="stat-item">
                <span class="number">150+</span>
                <span class="label">Enfants soutenus</span>
            </div>
            <div class="stat-item">
                <span class="number">5</span>
                <span class="label">Écoles réhabilitées</span>
            </div>
            <div class="stat-item">
                <span class="number">3</span>
                <span class="label">Centres d'alphabétisation</span>
            </div>
            <div class="stat-item">
                <span class="number">200+</span>
                <span class="label">Kits distribués</span>
            </div>
        </div>
    </section>

    <!-- INTRODUCTION -->
    <section class="section section-alt">
        <h2 class="section-title">Notre Mission Éducative</h2>
        <p class="section-subtitle">Conformément à l'Article 7.1 des Statuts</p>

        <div class="content-block" style="padding: 0;">
            <p>L'<strong>éducation</strong> est au cœur de notre mission. Nous croyons fermement que chaque enfant, chaque jeune et chaque adulte mérite d'avoir accès à une éducation de qualité, quel que soit son origine sociale ou sa situation géographique.</p>
            <p>En République Centrafricaine, où le taux de scolarisation reste faible et où de nombreuses écoles ont été détruites ou fermées à cause des conflits, notre association s'engage à <strong>combler les lacunes éducatives</strong> et à offrir des opportunités d'apprentissage à tous.</p>
            <p>Nos actions éducatives s'articulent autour de <strong>5 axes principaux</strong> définis par nos Statuts, chacun visant à renforcer les capacités des individus et des communautés.</p>
        </div>
    </section>

    <!-- ACTIVITÉS -->
    <section class="section">
        <h2 class="section-title">Nos 5 Activités Éducatives</h2>
        <p class="section-subtitle">Des programmes concrets pour un impact durable</p>

        <div class="activites-grid">

            <div class="activite-card">
                <div class="icon">✏️</div>
                <h3>Alphabétisation</h3>
                <p>Nous organisons des programmes d'alphabétisation pour les adultes et les jeunes déscolarisés, leur permettant d'acquérir les compétences de base en lecture, écriture et calcul.</p>
                <ul>
                    <li>Cours du soir pour adultes</li>
                    <li>Programmes adaptés aux jeunes déscolarisés</li>
                    <li>Formation d'alphabétiseurs locaux</li>
                    <li>Supports pédagogiques en français et en sango</li>
                </ul>
            </div>

            <div class="activite-card">
                <div class="icon">📖</div>
                <h3>Soutien Scolaire</h3>
                <p>Nous offrons un accompagnement personnalisé aux élèves en difficulté, les aidant à améliorer leurs résultats scolaires et à développer leur confiance en eux.</p>
                <ul>
                    <li>Cours de rattrapage après l'école</li>
                    <li>Aide aux devoirs gratuite</li>
                    <li>Mentorat par des bénévoles qualifiés</li>
                    <li>Préparation aux examens (BEPC, BAC)</li>
                </ul>
            </div>

            <div class="activite-card">
                <div class="icon">🏗️</div>
                <h3>Construction et Réhabilitation</h3>
                <p>Nous participons à la construction de nouvelles écoles et à la réhabilitation des bâtiments scolaires endommagés, créant ainsi des environnements d'apprentissage sûrs et décents.</p>
                <ul>
                    <li>Réhabilitation de salles de classe</li>
                    <li>Construction de latrines scolaires</li>
                    <li>Installation de mobiliers scolaires</li>
                    <li>Aménagement de bibliothèques</li>
                </ul>
            </div>

            <div class="activite-card">
                <div class="icon">🎒</div>
                <h3>Distribution de Kits Scolaires</h3>
                <p>Nous distribuons des kits scolaires complets aux enfants vulnérables, leur permettant de commencer l'année scolaire dans de bonnes conditions.</p>
                <ul>
                    <li>Cahiers, stylos, crayons et règles</li>
                    <li>Cartables et trousses</li>
                    <li>Livres et manuels scolaires</li>
                    <li>Uniformes scolaires pour les plus démunis</li>
                </ul>
            </div>

            <div class="activite-card">
                <div class="icon">🛠️</div>
                <h3>Formation Professionnelle</h3>
                <p>Nous organisons des formations professionnelles pour les jeunes et les adultes, leur permettant d'acquérir des compétences pratiques pour s'insérer sur le marché du travail.</p>
                <ul>
                    <li>Couture et stylisme</li>
                    <li>Mécanique automobile</li>
                    <li>Informatique et bureautique</li>
                    <li>Agriculture et élevage</li>
                    <li>Artisanat local</li>
                </ul>
            </div>

        </div>
    </section>

    <!-- IMPACT -->
    <section class="section section-alt">
        <div class="impact-box">
            <h3>🌟 Notre Impact en Chiffres</h3>
            <p>Depuis notre création, nous avons touché directement plus de <strong>500 bénéficiaires</strong> dans le domaine de l'éducation. Nos programmes d'alphabétisation ont permis à <strong>80 adultes</strong> de lire et écrire pour la première fois. Nos distributions de kits scolaires ont soutenu <strong>200 enfants</strong> dans leur scolarité. Nous avons réhabilité <strong>5 écoles</strong> dans le 8ème arrondissement de Bangui, offrant un environnement d'apprentissage décent à plus de <strong>300 élèves</strong>.</p>
        </div>
    </section>

    <!-- TÉMOIGNAGES -->
    <section class="section">
        <h2 class="section-title">Témoignages</h2>
        <p class="section-subtitle">Ce que disent nos bénéficiaires</p>

        <div class="temoignages-grid">

            <div class="temoignage-card">
                <div class="quote">Grâce au programme d'alphabétisation de l'Association I KOUE GUI A ITA, j'ai appris à lire et à écrire à 45 ans. Aujourd'hui, je peux aider mes enfants avec leurs devoirs et gérer mon petit commerce plus facilement.</div>
                <div class="author">
                    <div class="author-avatar">👩</div>
                    <div class="author-info">
                        <h4>Marie-Claire B.</h4>
                        <p>Participante au programme d'alphabétisation</p>
                    </div>
                </div>
            </div>

            <div class="temoignage-card">
                <div class="quote">Le soutien scolaire m'a permis de passer mon BEPC avec succès. Les bénévoles sont très patients et expliquent bien les leçons. Je recommande ce programme à tous les élèves en difficulté.</div>
                <div class="author">
                    <div class="author-avatar">👦</div>
                    <div class="author-info">
                        <h4>Jean-Paul K.</h4>
                        <p>Élève bénéficiaire du soutien scolaire</p>
                    </div>
                </div>
            </div>

            <div class="temoignage-card">
                <div class="quote">La formation en couture que j'ai reçue m'a permis de lancer mon propre atelier. Aujourd'hui, je forme à mon tour d'autres jeunes filles. C'est un cercle vertueux qui change des vies.</div>
                <div class="author">
                    <div class="author-avatar">👩‍🎓</div>
                    <div class="author-info">
                        <h4>Fatima N.</h4>
                        <p>Diplômée de la formation professionnelle</p>
                    </div>
                </div>
            </div>

            <div class="temoignage-card">
                <div class="quote">En tant que parent, je suis reconnaissant pour les kits scolaires distribués. Cela allège considérablement le budget de la rentrée et permet à mes enfants d'aller à l'école avec tout le matériel nécessaire.</div>
                <div class="author">
                    <div class="author-avatar">👨</div>
                    <div class="author-info">
                        <h4>Paul M.</h4>
                        <p>Parent d'élèves bénéficiaires</p>
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- NAVIGATION DOMAINES -->
    <section class="section section-alt">
        <h2 class="section-title">Découvrez Nos Autres Domaines</h2>
        <p class="section-subtitle">Une approche multidimensionnelle du développement</p>

        <div class="domaines-nav">
            <a onclick="window.showPage('education')" class="domaine-link active">
                <div class="icon">📚</div>
                <span>Éducation</span>
            </a>
            <a onclick="window.showPage('sante')" class="domaine-link">
                <div class="icon">🏥</div>
                <span>Santé</span>
            </a>
            <a onclick="window.showPage('agriculture')" class="domaine-link">
                <div class="icon">🌱</div>
                <span>Agriculture</span>
            </a>
            <a onclick="window.showPage('juridique')" class="domaine-link">
                <div class="icon">⚖️</div>
                <span>Juridique</span>
            </a>
            <a onclick="window.showPage('humanitaire')" class="domaine-link">
                <div class="icon">🤝</div>
                <span>Humanitaire</span>
            </a>
            <a onclick="window.showPage('jeunesse')" class="domaine-link">
                <div class="icon">🎯</div>
                <span>Jeunesse</span>
            </a>
        </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
        <h2>Soutenez nos actions éducatives</h2>
        <p>Votre don permet de financer des kits scolaires, de réhabiliter des écoles et de former des enseignants bénévoles</p>
        <div class="hero-buttons">
            <a href="#" onclick="window.showPage('soutenir')" class="btn btn-primary">💛 FAIRE UN DON</a>
            <a href="#" onclick="window.showPage('contact')" class="btn btn-secondary">📞 NOUS CONTACTER</a>
        </div>
    </section>
        </div>

        `;

html = html.replace(oldEducationPage, newEducationPage);
fs.writeFileSync('index.html', html);
