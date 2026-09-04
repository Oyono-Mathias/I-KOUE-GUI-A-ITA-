import { collection, getDocs, addDoc, setDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

// ---------------------------------------------------------
// VRAIES DONNÉES EXTRAITES DE VOS FICHIERS HTML
// ---------------------------------------------------------

const SEED_DATA: Record<string, any[]> = {
    // --- 1. DOMAINES (Transversal) ---
    domaines: [
        { name: "Éducation", slug: "education", icon: "📚", active: true },
        { name: "Santé", slug: "sante", icon: "🏥", active: true },
        { name: "Agriculture", slug: "agriculture", icon: "🌱", active: true },
        { name: "Juridique", slug: "juridique", icon: "⚖️", active: true },
        { name: "Humanitaire", slug: "humanitaire", icon: "🤝", active: true },
        { name: "Jeunesse", slug: "jeunesse", icon: "🎯", active: true }
    ],

    // --- 2. PAGE ÉDUCATION ---
    stats: [
        { number: "150+", label: "Enfants soutenus" },
        { number: "5", label: "Écoles réhabilitées" },
        { number: "3", label: "Centres d'alphabétisation" },
        { number: "200+", label: "Kits distribués" }
    ],
    activites: [
        { icon: "✏️", title: "Alphabétisation", description: "Nous organisons des programmes d'alphabétisation pour les adultes et les jeunes déscolarisés, leur permettant d'acquérir les compétences de base en lecture, écriture et calcul.", points: ["Cours du soir pour adultes", "Programmes adaptés aux jeunes déscolarisés", "Formation d'alphabétiseurs locaux", "Supports pédagogiques en français et en sango"] },
        { icon: "📖", title: "Soutien Scolaire", description: "Nous offrons un accompagnement personnalisé aux élèves en difficulté, les aidant à améliorer leurs résultats scolaires et à développer leur confiance en eux.", points: ["Cours de rattrapage après l'école", "Aide aux devoirs gratuite", "Mentorat par des bénévoles qualifiés", "Préparation aux examens (BEPC, BAC)"] },
        { icon: "🏫", title: "Construction et Réhabilitation d'Infrastructures Scolaires", description: "Nous participons à la construction de nouvelles écoles et à la réhabilitation des bâtiments scolaires endommagés, créant ainsi des environnements d'apprentissage sûrs et décents.", points: ["Réhabilitation de salles de classe", "Construction de latrines scolaires", "Installation de mobiliers scolaires", "Aménagement de bibliothèques"] },
        { icon: "🎒", title: "Distribution de Kits Scolaires", description: "Nous distribuons des kits scolaires complets aux enfants vulnérables, leur permettant de commencer l'année scolaire dans de bonnes conditions.", points: ["Cahiers, stylos, crayons et règles", "Cartables et trousses", "Livres et manuels scolaires", "Uniformes scolaires pour les plus démunis"] },
        { icon: "🛠️", title: "Formation Professionnelle", description: "Nous organisons des formations professionnelles pour les jeunes et les adultes, leur permettant d'acquérir des compétences pratiques pour s'insérer sur le marché du travail.", points: ["Couture et stylisme", "Mécanique automobile", "Informatique et bureautique", "Agriculture et élevage", "Artisanat local"] }
    ],
    temoignages: [
        { quote: "Grâce au programme d'alphabétisation de l'Association I KOUE GUI A ITA, j'ai appris à lire et à écrire à 45 ans. Aujourd'hui, je peux aider mes enfants avec leurs devoirs et gérer mon petit commerce plus facilement.", authorName: "Marie-Claire B.", authorRole: "Participante au programme d'alphabétisation", avatar: "👩" },
        { quote: "Le soutien scolaire m'a permis de passer mon BEPC avec succès. Les bénévoles sont très patients et expliquent bien les leçons. Je recommande ce programme à tous les élèves en difficulté.", authorName: "Jean-Paul K.", authorRole: "Élève bénéficiaire du soutien scolaire", avatar: "👦" },
        { quote: "La formation en couture que j'ai reçue m'a permis de lancer mon propre atelier. Aujourd'hui, je forme à mon tour d'autres jeunes filles. C'est un cercle vertueux qui change des vies.", authorName: "Fatima N.", authorRole: "Diplômée de la formation professionnelle", avatar: "👩‍🎓" },
        { quote: "En tant que parent, je suis reconnaissant pour les kits scolaires distribués. Cela allège considérablement le budget de la rentrée et permet à mes enfants d'aller à l'école avec tout le matériel nécessaire.", authorName: "Paul M.", authorRole: "Parent d'élèves bénéficiaires", avatar: "👨" }
    ],

    // --- 3. PAGE SANTÉ ---
    stats_sante: [
        { number: "500+", label: "Personnes soignées" },
        { number: "10", label: "Campagnes médicales" },
        { number: "800+", label: "Personnes sensibilisées" },
        { number: "200+", label: "Consultations gratuites" }
    ],
    activites_sante: [
        { icon: "📢", title: "Sensibilisation Sanitaire", description: "Nous organisons des campagnes de sensibilisation dans les quartiers et les villages pour informer les populations sur les bonnes pratiques d'hygiène, la nutrition et la prévention des maladies.", points: ["Ateliers d'éducation sanitaire", "Distribution de dépliants informatifs", "Causeries éducatives dans les écoles", "Sensibilisation en langues locales"] },
        { icon: "🩺", title: "Campagnes Médicales", description: "Nous organisons des campagnes médicales mobiles avec des professionnels de santé bénévoles pour offrir des consultations gratuites et des distributions de médicaments aux populations qui n'y ont pas accès.", points: ["Consultations médicales gratuites", "Dépistage du paludisme et du VIH", "Vaccination des enfants", "Distribution de médicaments essentiels"] },
        { icon: "🤝", title: "Assistance aux Personnes Malades", description: "Nous apportons un soutien matériel et moral aux personnes malades et à leurs familles, en particulier celles qui sont dans l'incapacité de payer les frais médicaux.", points: ["Prise en charge des frais médicaux", "Visites de soutien aux malades", "Aide à l'achat de médicaments", "Accompagnement psychosocial"] },
        { icon: "🧼", title: "Promotion de l'Hygiène", description: "Nous menons des actions pour améliorer les conditions d'hygiène dans les communautés, en formant les populations aux bonnes pratiques et en installant des infrastructures de base.", points: ["Construction de latrines", "Installation de points d'eau potable", "Formation aux gestes d'hygiène", "Distribution de savons"] },
        { icon: "🛡️", title: "Lutte contre les Maladies", description: "Nous menons des actions spécifiques de prévention et de lutte contre les maladies endémiques en RCA, notamment le paludisme, le VIH/SIDA et les maladies diarrhéiques.", points: ["Distribution de moustiquaires", "Campagnes de dépistage", "Programmes de traitement de l'eau", "Lutte contre la malnutrition"] }
    ],
    temoignages_sante: [
        { quote: "Grâce à la campagne médicale de l'Association, mon enfant a pu être vacciné gratuitement. Nous n'avions pas les moyens d'aller au centre de santé. Dieu bénisse cette association.", authorName: "Christine M.", authorRole: "Mère bénéficiaire", avatar: "👩" },
        { quote: "J'ai été diagnostiqué séropositif lors du dépistage gratuit organisé par l'Association. Grâce à leur accompagnement, j'ai pu commencer mon traitement et aujourd'hui je vis normalement.", authorName: "Patrick K.", authorRole: "Bénéficiaire du programme", avatar: "👨" },
        { quote: "Les ateliers de sensibilisation à l'hygiène ont changé notre quartier. Nous avons construit des latrines communautaires et les maladies diarrhéiques ont diminué de moitié.", authorName: "Chef de quartier", authorRole: "Responsable communautaire", avatar: "👨‍👩‍👧" },
        { quote: "En tant qu'infirmière bénévole, je suis fière de participer aux campagnes médicales. Voir la gratitude dans les yeux des patients est une motivation immense.", authorName: "Sœur Marie-José", authorRole: "Infirmière bénévole", avatar: "👩‍⚕️" }
    ],

    // --- 4. PAGE AGRICULTURE ---
    stats_agri: [
        { number: "200+", label: "Agriculteurs formés" },
        { number: "50", label: "Coopératives soutenues" },
        { number: "10", label: "Hectares cultivés" },
        { number: "300+", label: "Familles bénéficiaires" }
    ],
    activites_agri: [
        { icon: "🌾", title: "Appui aux Activités Agricoles", description: "Nous accompagnons les agriculteurs dans la mise en œuvre de leurs activités agricoles en leur fournissant des outils, des semences améliorées et un accompagnement technique personnalisé.", points: ["Distribution de semences de qualité", "Fourniture d'outils agricoles adaptés", "Accompagnement technique sur le terrain", "Accès au microcrédit agricole", "Mise en place de jardins communautaires"] },
        { icon: "👨‍🌾", title: "Formation des Agriculteurs", description: "Nous organisons des ateliers de formation pratique pour transmettre aux agriculteurs les techniques agricoles modernes et durables, adaptées au contexte centrafricain.", points: ["Techniques de culture durable", "Gestion de l'eau et irrigation", "Lutte biologique contre les ravageurs", "Techniques de récolte et de stockage", "Formation en agroécologie"] },
        { icon: "🐄", title: "Promotion de l'Élevage et de l'Agroalimentaire", description: "Nous soutenons les éleveurs et les petites entreprises agroalimentaires pour diversifier les sources de revenus et améliorer la transformation des produits agricoles.", points: ["Formation en élevage", "Soutien à la production laitière", "Techniques de transformation agroalimentaire", "Création de petites unités de transformation", "Commercialisation des produits locaux"] },
        { icon: "🍚", title: "Sécurité Alimentaire", description: "Nous mettons en œuvre des programmes visant à garantir l'accès à une alimentation suffisante, saine et nutritive pour les familles vulnérables, en particulier en période de soudure.", points: ["Programmes de maraîchage familial", "Techniques de conservation des récoltes", "Création de banques de semences", "Programmes de cantines scolaires", "Lutte contre la malnutrition infantile"] },
        { icon: "🌳", title: "Protection de l'Environnement", description: "Nous sensibilisons les communautés à la gestion durable des ressources naturelles et promouvons des pratiques agricoles respectueuses de l'environnement.", points: ["Programmes de reboisement", "Agroforesterie et cultures associées", "Gestion durable des sols", "Protection des bassins versants", "Sensibilisation au changement climatique"] }
    ],
    temoignages_agri: [
        { quote: "Grâce à la formation reçue de l'Association, j'ai appris les techniques de maraîchage moderne. Aujourd'hui, je cultive des tomates et je vends au marché. Mes revenus ont doublé.", authorName: "Joseph M.", authorRole: "Agriculteur formé", avatar: "👨‍🌾" },
        { quote: "Le programme d'élevage de volailles m'a permis de lancer mon propre poulailler. Je forme à mon tour d'autres femmes du quartier. C'est une vraie autonomisation.", authorName: "Antoinette K.", authorRole: "Éleveuse bénéficiaire", avatar: "👩‍🌾" },
        { quote: "La coopérative agricole que nous avons créée avec l'aide de l'Association nous permet d'acheter les semences en gros et de vendre nos récoltes collectivement.", authorName: "Président Coopérative", authorRole: "Coopérative accompagnée", avatar: "👥" },
        { quote: "Les enfants de notre école bénéficient maintenant de repas chauds grâce au programme de cantine scolaire. La fréquentation a augmenté.", authorName: "Directrice d'école", authorRole: "8ème Arrondissement", avatar: "👩‍🏫" }
    ],

    // --- 5. PAGE JURIDIQUE ---
    stats_juridique: [
        { number: "100+", label: "Personnes accompagnées" },
        { number: "15", label: "Ateliers de sensibilisation" },
        { number: "30", label: "Cas de médiation réussis" },
        { number: "50+", label: "Victimes de VBG soutenues" }
    ],
    activites_juridique: [
        { icon: "⚖️", title: "Accompagnement Juridique", description: "Nous offrons un accompagnement juridique gratuit aux personnes vulnérables qui n'ont pas les moyens de recourir à un avocat.", points: ["Consultations juridiques gratuites", "Oriention vers les tribunaux", "Assistance dans les procédures", "Accompagnement des victimes", "Soutien juridique aux femmes et enfants"] },
        { icon: "📜", title: "Sensibilisation aux Droits", description: "Nous organisons des ateliers pour informer les populations sur leurs droits fondamentaux, les mécanismes de protection et les recours possibles.", points: ["Ateliers d'éducation", "Formation des leaders", "Sensibilisation dans les écoles", "Supports informatifs", "Partenariats avec des ONG"] },
        { icon: "🕊️", title: "Médiation Sociale", description: "Nous intervenons comme médiateurs neutres pour résoudre pacifiquement les conflits communautaires, familiaux et interpersonnels.", points: ["Médiation des conflits fonciers", "Résolution des différends", "Médiation post-conflit", "Formation de médiateurs", "Cohésion sociale"] },
        { icon: "🛑", title: "Lutte contre les VBG", description: "Nous menons des actions spécifiques de prévention, de sensibilisation et de prise en charge des victimes de violences basées sur le genre.", points: ["Prise en charge psychosociale", "Orientation médicale", "Lutte contre les mariages forcés", "Plaidoyer pour la protection"] }
    ],
    temoignages_juridique: [
        { quote: "Après le décès de mon mari, ma belle-famille a voulu me chasser de la maison. Grâce à l'accompagnement juridique de l'Association, j'ai pu faire valoir mes droits.", authorName: "Thérèse M.", authorRole: "Veuve bénéficiaire", avatar: "👩" },
        { quote: "L'atelier de sensibilisation aux droits humains dans notre quartier a changé notre vision. Nous savons maintenant que nous avons des droits et que nous pouvons les défendre.", authorName: "Responsable d'association", authorRole: "Galabadja II", avatar: "👩‍🦳" },
        { quote: "Un conflit foncier opposait deux familles depuis des années. Grâce à la médiation de l'Association, nous avons trouvé une solution pacifique acceptable pour tous.", authorName: "Chef de quartier", authorRole: "8ème Arrondissement", avatar: "👨‍🦳" },
        { quote: "Victime de violences conjugales, je n'osais pas en parler. L'équipe m'a écoutée, soutenue et orientée. Aujourd'hui, je suis libre et je reconstruis ma vie.", authorName: "Marie-Jeanne K.", authorRole: "Bénéficiaire lutte VBG", avatar: "👩‍🦱" }
    ],

    // --- 6. PAGE HUMANITAIRE ---
    stats_humanitaire: [
        { number: "300+", label: "Familles assistées" },
        { number: "500+", label: "Kits alimentaires" },
        { number: "50+", label: "Personnes handicapées" },
        { number: "15", label: "Interventions d'urgence" }
    ],
    activites_humanitaire: [
        { icon: "👨‍👩‍👧‍👦", title: "Assistance aux Orphelins, Veuves et Déplacés", description: "Nous apportons un soutien global aux personnes les plus vulnérables de notre société confrontées à la précarité.", points: ["Prise en charge scolaire", "Soutien psychosocial", "Hébergement d'urgence", "Réinsertion sociale", "Parrainage d'enfants"] },
        { icon: "🍞", title: "Aide Alimentaire et Vestimentaire", description: "Nous organisons régulièrement des distributions de vivres et de vêtements aux familles les plus démunies.", points: ["Distribution de kits alimentaires", "Vêtements et couvertures", "Aide d'urgence", "Cantines populaires", "Soutien nutritionnel"] },
        { icon: "♿", title: "Soutien aux Personnes Handicapées", description: "Nous militons pour l'inclusion sociale des personnes en situation de handicap et leur apportons un soutien matériel et moral.", points: ["Aides techniques (fauteuils, béquilles)", "Intégration sociale", "Formation professionnelle", "Lutte contre la discrimination", "Plaidoyer pour l'accessibilité"] },
        { icon: "🚨", title: "Secours d'Urgence", description: "Nous intervenons rapidement en cas de catastrophes naturelles ou de crises humanitaires pour porter assistance aux populations.", points: ["Évaluation des besoins", "Secours d'urgence", "Abris temporaires", "Coordination humanitaire", "Reconstruction"] }
    ],
    temoignages_humanitaire: [
        { quote: "Après la mort de mon mari pendant les conflits, je me suis retrouvée seule. L'Association m'a apporté des vivres et a pris en charge la scolarité de mes enfants.", authorName: "Justine M.", authorRole: "Veuve bénéficiaire", avatar: "👩" },
        { quote: "J'ai perdu mes deux jambes dans un accident. Grâce à l'Association, j'ai reçu un fauteuil roulant et une formation en vannerie. Je nourris mes enfants.", authorName: "Emmanuel K.", authorRole: "Personne accompagnée", avatar: "👨" },
        { quote: "Quand les inondations ont détruit notre quartier, l'Association a été la première à arriver avec des vivres. Ce sont de vrais Samaritains.", authorName: "Chef de famille", authorRole: "Déplacé", avatar: "👨‍👩‍👦" },
        { quote: "Mes parents sont morts pendant la guerre. L'Association m'a recueilli, m'a envoyé à l'école. Je rêve de devenir médecin pour aider les autres.", authorName: "David, 14 ans", authorRole: "Orphelin parrainé", avatar: "👦" }
    ],

    // --- 7. PAGE JEUNESSE ---
    stats_jeunesse: [
        { number: "250+", label: "Jeunes formés" },
        { number: "20", label: "Projets entrepreneuriaux" },
        { number: "10", label: "Événements culturels" },
        { number: "60%", label: "Filles accompagnées" }
    ],
    activites_jeunesse: [
        { icon: "🧑‍🏫", title: "Encadrement des Jeunes", description: "Nous mettons en place des programmes de mentorat et de leadership pour accompagner les jeunes dans leur développement personnel.", points: ["Mentorat individuel", "Ateliers de développement", "Leadership", "Orientation scolaire", "Clubs de jeunes"] },
        { icon: "💼", title: "Promotion de l'Entrepreneuriat", description: "Nous accompagnons les jeunes dans la création et le développement de leurs propres entreprises.", points: ["Création d'entreprise", "Business plan", "Microcrédit", "Incubation", "Mise en réseau"] },
        { icon: "🎭", title: "Activités Culturelles et Sportives", description: "Nous organisons des événements pour promouvoir la cohésion sociale et l'expression artistique.", points: ["Tournois sportifs", "Festivals culturels", "Ateliers musique et théâtre", "Poésie", "Sports traditionnels"] },
        { icon: "🛠️", title: "Formation aux Métiers", description: "Nous proposons des formations professionnelles pratiques dans des métiers porteurs.", points: ["Couture et stylisme", "Mécanique", "Informatique", "Menuiserie", "Coiffure", "Agriculture moderne"] }
    ],
    temoignages_jeunesse: [
        { quote: "Grâce à la formation en couture, j'ai appris le métier et j'ai reçu une machine pour démarrer. L'Association m'a donné les moyens de rêver et de réaliser mes rêves.", authorName: "Esther K., 22 ans", authorRole: "Entrepreneure", avatar: "👩‍🎓" },
        { quote: "Le programme de mentorat m'a aidé à découvrir mes talents. J'étais perdu après le lycée. Aujourd'hui, je suis en formation d'informatique.", authorName: "Patrick M., 19 ans", authorRole: "Bénéficiaire", avatar: "👦" },
        { quote: "Les tournois de football organisés ont permis de réunir les jeunes de différents quartiers qui ne se parlaient plus. Le sport a créé des liens.", authorName: "Capitaine d'équipe", authorRole: "Participant", avatar: "👨‍👦" },
        { quote: "En tant que jeune fille, je n'osais pas parler. L'Association m'a encouragée. Aujourd'hui, je suis responsable d'un club de jeunes dans mon quartier.", authorName: "Marie-José N., 17 ans", authorRole: "Responsable de club", avatar: "👧" }
    ],

    // --- 8. PAGE À PROPOS ---
    stats_apropos: [
        { number: "6", label: "Domaines d'action" },
        { number: "4", label: "Catégories de membres" },
        { number: "∞", label: "Durée illimitée" },
        { number: "100%", label: "Engagement social" }
    ],
    objectifs: [
        { text: "Lutter contre la pauvreté et l'exclusion sociale" },
        { text: "Améliorer les conditions de vie des populations démunies" },
        { text: "Promouvoir l'éducation pour tous" },
        { text: "Faciliter l'accès aux soins de santé" },
        { text: "Défendre les droits humains et promouvoir l'assistance juridique" },
        { text: "Soutenir l'autonomisation des femmes et des jeunes" },
        { text: "Promouvoir la paix, la cohésion sociale et le vivre-ensemble" },
        { text: "Encourager les initiatives agricoles et le développement rural" },
        { text: "Assister les victimes de catastrophes et les personnes vulnérables" }
    ],
    valeurs: [
        { icon: "🤝", title: "Solidarité", description: "L'entraide et le soutien mutuel au cœur de toutes nos actions pour les populations vulnérables.", bgColor: "#E3F2FD" },
        { icon: "🔍", title: "Transparence", description: "Une gestion claire, responsable et redevable de nos ressources et de nos activités.", bgColor: "#FFF8E1" },
        { icon: "💪", title: "Engagement", description: "Une détermination sans faille pour le bien-être des populations et le développement de la RCA.", bgColor: "#E8F5E9" },
        { icon: "⚖️", title: "Équité", description: "50% hommes, 50% femmes dans l'exécution des tâches, conformément à notre Règlement Intérieur.", bgColor: "#F3E5F5" },
        { icon: "🕊️", title: "Paix", description: "Promotion de la cohésion sociale, du vivre-ensemble et de la réconciliation communautaire.", bgColor: "#E3F2FD" },
        { icon: "🌍", title: "Durabilité", description: "Agir aujourd'hui pour construire un avenir meilleur pour les générations futures.", bgColor: "#E8F5E9" }
    ],
    natures: [
        { title: "Sociale", description: "Au service des populations et du bien-être commun" },
        { title: "Apolitique", description: "Indépendante de tout parti ou mouvement politique" },
        { title: "Non confessionnelle", description: "Ouverte à tous, sans distinction religieuse" },
        { title: "Sans but lucratif", description: "Tous nos moyens sont réinvestis dans nos missions" }
    ],

    // --- 9. PAGE MENTIONS LÉGALES ---
    legal_identity: [
        { icon: "🏛️", title: "Dénomination Officielle", content: "<p><strong>Association I KOUE GUI A ITA</strong></p><p>Association apolitique, non confessionnelle et sans but lucratif, reconnue d'utilité publique en République Centrafricaine.</p>", infoBoxTitle: "Devise", infoBoxContent: "<strong>Ensemble – Volonté – Engagement</strong>" },
        { icon: "📍", title: "Siège Social", content: "<p><strong>Galabadja II</strong><br>8ème Arrondissement<br>Bangui, République Centrafricaine</p>", infoBoxTitle: "Transfert du siège", infoBoxContent: "Le siège peut être transféré en tout autre lieu du territoire national par décision du Bureau exécutif, sous réserve de ratification par l'Assemblée générale (Article 2 des Statuts)." },
        { icon: "📅", title: "Durée et Création", content: "<p>L'Association est créée pour une <strong>durée illimitée</strong> (Article 3 des Statuts).</p>", infoBoxTitle: "Assemblée Générale Constitutive", infoBoxContent: "Faite à Bangui le <strong>13 Juillet 2025</strong>" },
        { icon: "👤", title: "Président Fondateur", content: "<p><strong>Mr Sosthène Mickaïlove ZONAITA</strong></p><p>Signataire de l'Assemblée Générale Constitutive et superviseur du fonctionnement de l'Association.</p>" }
    ],
    legal_framework: [
        { icon: "📋", title: "Nature de l'Association", intro: "Conformément à l'Article 4 des Statuts, l'Association I KOUE GUI A ITA est :", points: ["<strong>Sociale</strong> — Au service des populations et du bien-être commun", "<strong>Apolitique</strong> — Indépendante de tout parti ou mouvement politique", "<strong>Non confessionnelle</strong> — Ouverte à tous, sans distinction religieuse", "<strong>Sans but lucratif</strong> — Tous les moyens sont réinvestis dans les missions"] },
        { icon: "🎯", title: "But de l'Association", intro: "Conformément à l'Article 5 des Statuts :", points: ["Promouvoir la solidarité, l'autonomisation de la femme et des filles, le droit de l'enfant, l'environnement, l'agriculture, l'élevage, l'entraide sociale et le développement durable, la communication (Média) au profit des populations vulnérables en République Centrafricaine."] }
    ],
    legal_docs: [
        { title: "📄 Statuts de l'Association", meta: "PDF • 19 articles • Adoptés le 13 Juillet 2025", buttonText: "⬇ Télécharger" },
        { title: "📘 Règlement Intérieur", meta: "PDF • 18 articles • Adopté le 13 Juillet 2025", buttonText: "⬇ Télécharger" },
        { title: "📄 Loi N° 61/233 du 27 Mai 1961", meta: "Texte de loi régissant les associations en RCA", buttonText: "⬇ Consulter" },
        { title: "📄 Récépissé de Reconnaissance", meta: "PDF • Document officiel de reconnaissance", buttonText: "⬇ Télécharger" }
    ],
    legal_contacts: [
        { icon: "📧", title: "Par Email", content: "<p><strong>associationikoueguiaita@gmail.com</strong></p><p>Réponse sous 48h ouvrables</p>" },
        { icon: "📱", title: "Par WhatsApp", content: "<p><strong>+236 75 03 08 57</strong><br><strong>+236 72 06 12 02</strong></p><p>Disponible du lundi au samedi</p>" },
        { icon: "📍", title: "Par Courrier", content: "<p><strong>Association I KOUE GUI A ITA</strong><br>Galabadja II, 8ème Arrondissement<br>Bangui, République Centrafricaine</p>" },
        { icon: "🕐", title: "Horaires", content: "<p><strong>Lundi - Vendredi :</strong> 8h00 - 17h00<br><strong>Samedi :</strong> 9h00 - 13h00<br><strong>Dimanche :</strong> Fermé</p>" }
    ],

    // --- 10. PAGE ESPACE MEMBRE ---
    avantages_membres: [
        { icon: "🗳️", title: "Droit de vote et d'éligibilité", description: "Participez aux Assemblées Générales, élisez les membres du Bureau et soyez éligible à tous les postes de l'Association." },
        { icon: "📋", title: "Accès aux documents internes", description: "Consultez les rapports d'activités, les rapports financiers, les procès-verbaux des AG et les convocations officielles." },
        { icon: "💡", title: "Droit de proposition", description: "Soumettez toute proposition ou suggestion relative aux activités de l'Association et accédez à toutes les informations la concernant." },
        { icon: "🎫", title: "Carte de membre officielle", description: "Recevez votre carte de membre avec QR code, attestant de votre appartenance à l'Association I KOUE GUI A ITA." },
        { icon: "📢", title: "Informations exclusives", description: "Recevez en avant-première les actualités, les rapports d'activités et les invitations aux événements de l'Association." },
        { icon: "🤝", title: "Réseau de solidarité", description: "Intégrez un réseau de membres engagés pour la solidarité, le développement et l'autonomisation en RCA." }
    ],
    securite_info: [
        { text: "Connexion sécurisée par protocole HTTPS" },
        { text: "Mots de passe cryptés et stockés de manière sécurisée" },
        { text: "Session automatique fermée après 30 minutes d'inactivité" },
        { text: "Données personnelles protégées conformément à la législation en vigueur" },
        { text: "Aucune donnée partagée avec des tiers" }
    ],
    aide_connexion: [
        { icon: "📱", title: "Via WhatsApp", description: "Contactez-nous au <strong>+236 75 03 08 57</strong> pour récupérer vos identifiants ou signaler un problème de connexion." },
        { icon: "✉️", title: "Par Email", description: "Écrivez-nous à <strong>associationikoueguiaita@gmail.com</strong> avec votre numéro de membre pour recevoir vos identifiants." },
        { icon: "🎫", title: "Via votre carte de membre", description: "Scannez le QR code présent sur votre carte de membre pour accéder directement à votre espace personnel." },
        { icon: "📍", title: "Au siège social", description: "Rendez-vous à notre siège à <strong>Galabadja II, 8ème Arrondissement de Bangui</strong> du lundi au samedi aux heures d'ouverture." }
    ]
};

// ---------------------------------------------------------
// FONCTION D'AUTOMATISATION
// ---------------------------------------------------------

export const seedUsers = async () => {
    const logs: string[] = [];
    let superAdminUid = "";
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, "superadmin@ikoueguiaita.org", "Admin123!");
        superAdminUid = userCredential.user.uid;
        logs.push(`✅ Utilisateur superadmin créé dans Auth (${superAdminUid})`);
    } catch (e: any) {
        if (e.code === 'auth/email-already-in-use') {
            logs.push(`⏭️ L'utilisateur superadmin existe déjà dans Auth.`);
        } else {
            logs.push(`❌ Erreur Auth: ${e.message}`);
            return logs;
        }
    }

    // Le compte existe probablement, donc on crée ou met à jour le document Firestore pour forcer le rôle
    try {
        // Comme on ne connait pas le UID si 'email-already-in-use' sans se connecter, 
        // on va supposer que dans notre script d'init on veut au moins s'assurer que c'est fait
        // Si superAdminUid est vide, cela signifie qu'il existait déjà.
        if (superAdminUid) {
            await setDoc(doc(db, "users", superAdminUid), {
                email: "superadmin@ikoueguiaita.org",
                displayName: "Président Fondateur",
                role: "super_admin",
                statut: "actif",
                photoURL: ""
            });
            logs.push(`✅ Document Firestore 'users' créé pour superadmin`);
        }
    } catch (e: any) {
        logs.push(`❌ Erreur Document Firestore: ${e.message}`);
    }
    
    return logs;
};

export const seedAll = async () => {
    let totalCreated = 0;
    const logs: string[] = [];

    try {
        const userLogs = await seedUsers();
        logs.push(...userLogs);

        for (const [collectionName, documents] of Object.entries(SEED_DATA)) {
            const collRef = collection(db, collectionName);
            const snapshot = await getDocs(collRef);

            // Vérification anti-doublon absolue : Si la collection contient déjà au moins 1 document, on passe.
            if (!snapshot.empty) {
                logs.push(`⏭️ Collection '${collectionName}' ignorée : contient déjà ${snapshot.size} documents.`);
                continue;
            }

            // Si elle est vide, on ajoute les documents extraits du HTML
            let count = 0;
            for (const docData of documents) {
                await addDoc(collRef, {
                    ...docData,
                    createdAt: new Date().toISOString()
                });
                count++;
                totalCreated++;
            }
            logs.push(`✅ Collection '${collectionName}' créée avec succès : ${count} documents ajoutés.`);
        }

        return { success: true, total: totalCreated, logs };
    } catch (error: any) {
        console.error("Erreur lors de l'initialisation de la base :", error);
        return { success: false, total: totalCreated, logs: [`❌ ERREUR FATALE : ${error.message}`] };
    }
};
