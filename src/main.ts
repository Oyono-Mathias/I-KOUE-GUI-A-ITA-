import AdminSeed from "./pages/AdminSeed";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import { app, db, auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Education } from './components/Education';


// Global Navigation State
declare global {
  interface Window {
    showPage: (pageId: string) => void;
    toggleMenu: () => void;
    handleContactForm: (e: Event) => void;
    handleAdhesionForm: (e: Event) => void;
    handleLogin: (e: Event) => void;
    handleLogout: () => void;
    handleNewsletter: (e: Event) => void;
  }
}

// Basic navigation logic
window.showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');
    
    document.querySelectorAll('.bottom-nav a').forEach(link => link.classList.remove('active'));
    const navLink = document.getElementById('nav-' + pageId);
    if (navLink) navLink.classList.add('active');
    
    window.scrollTo(0, 0);
};

window.toggleMenu = () => {
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');
    if(menu && overlay) {
        menu.classList.toggle('active');
        overlay.classList.toggle('active');
    }
};

// ----------------------------------------------------
// FIREBASE INTEGRATION
// ----------------------------------------------------

// 1. Authentification
onAuthStateChanged(auth, (user) => {
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContainer = document.getElementById('dashboardContainer');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    if (user) {
        if(loginContainer) loginContainer.style.display = 'none';
        if(dashboardContainer) dashboardContainer.style.display = 'block';
        if(userEmailDisplay) userEmailDisplay.textContent = user.email || '';
    } else {
        if(loginContainer) loginContainer.style.display = 'block';
        if(dashboardContainer) dashboardContainer.style.display = 'none';
        if(userEmailDisplay) userEmailDisplay.textContent = '';
    }
});

window.handleLogin = async (event) => {
    event.preventDefault();
    const email = (document.getElementById('loginEmail') as HTMLInputElement).value;
    const password = (document.getElementById('loginPassword') as HTMLInputElement).value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('Connexion réussie !');
    } catch (error: any) {
        alert("Erreur de connexion : " + error.message);
    }
};

window.handleLogout = async () => {
    try {
        await signOut(auth);
        alert('Vous êtes déconnecté.');
    } catch (error: any) {
        alert("Erreur lors de la déconnexion : " + error.message);
    }
};

// 2. Formulaires Dynamiques
window.handleContactForm = async (event) => {
    event.preventDefault();
    const btn = (event.target as HTMLFormElement).querySelector('button');
    if(btn) btn.disabled = true;

    try {
        await addDoc(collection(db, 'messages'), {
            nom: (document.getElementById('contactNom') as HTMLInputElement).value,
            email: (document.getElementById('contactEmail') as HTMLInputElement).value,
            tel: (document.getElementById('contactTel') as HTMLInputElement).value,
            sujet: (document.getElementById('contactSujet') as HTMLSelectElement).value,
            message: (document.getElementById('contactMessage') as HTMLTextAreaElement).value,
            createdAt: serverTimestamp()
        });
        alert('✅ Message envoyé avec succès ! Nous vous répondrons sous 48h.');
        (event.target as HTMLFormElement).reset();
    } catch (error: any) {
        alert("Erreur lors de l'envoi : " + error.message);
    } finally {
        if(btn) btn.disabled = false;
    }
};

window.handleAdhesionForm = async (event) => {
    event.preventDefault();
    const btn = (event.target as HTMLFormElement).querySelector('button');
    if(btn) btn.disabled = true;

    try {
        await addDoc(collection(db, 'adhesions'), {
            nom: (document.getElementById('adhesionNom') as HTMLInputElement).value,
            email: (document.getElementById('adhesionEmail') as HTMLInputElement).value,
            tel: (document.getElementById('adhesionTel') as HTMLInputElement).value,
            statut: 'En attente de validation',
            createdAt: serverTimestamp()
        });
        alert('✅ Demande d\'adhésion soumise avec succès ! Elle est en attente de validation.');
        (event.target as HTMLFormElement).reset();
    } catch (error: any) {
        alert("Erreur lors de la demande : " + error.message);
    } finally {
        if(btn) btn.disabled = false;
    }
};

// 3. Actualités en Temps Réel
const loadNews = () => {
    const q = query(collection(db, 'actualites'), orderBy('createdAt', 'desc'), limit(4));
    const container = document.getElementById('newsGridContainer');
    
    if(!container) return;

    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align:center;width:100%;">Aucune actualité pour le moment.</p>';
            return;
        }

        container.innerHTML = '';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : 'Récent';
            
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <div class="news-image" style="background-image: url('${data.image_url || ''}'); background-size: cover; background-position: center;">
                    ${data.image_url ? '' : '📰'}
                </div>
                <div class="news-content">
                    <div class="news-date">📅 ${date}</div>
                    <h4>${data.titre || 'Sans titre'}</h4>
                    <p>${data.contenu || ''}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }, (error) => {
        console.error("Erreur de chargement des actualités", error);
        container.innerHTML = '<p style="text-align:center;width:100%;color:red;">Erreur de chargement.</p>';
    });
};

// Initialize news feed listener
loadNews();

const loadStats = async () => {
    const statDomaines = document.getElementById('stat-domaines');
    const statMembres = document.getElementById('stat-membres');
    const statEngagement = document.getElementById('stat-engagement');

    if (!statDomaines || !statMembres || !statEngagement) return;

    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout 3G (4s)')), 4000)
    );

    try {
        console.log("Tentative de chargement des statistiques depuis Firestore...");
        const docRef = doc(db, "site_stats", "general");
        const docSnap = await Promise.race([getDoc(docRef), timeout]) as any;

        if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            console.log("Statistiques chargées avec succès :", data);
            
            // Animation des compteurs
            const animateValue = (obj: HTMLElement, start: number, end: number, duration: number, suffix = '') => {
                let startTimestamp: number | null = null;
                const step = (timestamp: number) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    obj.innerHTML = Math.floor(progress * (end - start) + start) + suffix;
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
            };

            if (data.domaines) animateValue(statDomaines, 0, data.domaines, 1500);
            if (data.membres) animateValue(statMembres, 0, data.membres, 1500);
            if (data.engagement) animateValue(statEngagement, 0, data.engagement, 2000, '%');
            
        } else {
            console.log("Aucun document de stats trouvé, utilisation des valeurs par défaut.");
        }
    } catch (error: any) {
        console.warn("Échec du chargement Firebase, maintien des valeurs en dur (Fallback 3G). Erreur :", error.message);
        // Fallback visuel optionnel (les valeurs HTML de base restent affichées)
    }
};

loadStats();

// Filtrage des actualités (Page Actualités)
document.addEventListener('DOMContentLoaded', () => {
    const filterBtns = document.querySelectorAll('#page-actualites .filter-btn');
    const newsCards = document.querySelectorAll('#page-actualites .news-card, #page-actualites .news-featured');
    const noResults = document.getElementById('noResults');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const category = this.getAttribute('data-category');
                let visibleCount = 0;

                newsCards.forEach(card => {
                    const el = card as HTMLElement;
                    if (category === 'all' || el.getAttribute('data-category') === category) {
                        el.style.display = 'block';
                        visibleCount++;
                    } else {
                        el.style.display = 'none';
                    }
                });

                if (noResults) {
                    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
                }
            });
        });
    }
});

// Newsletter
window.handleNewsletter = (event) => {
    event.preventDefault();
    alert('✅ Merci pour votre inscription ! Vous recevrez nos prochaines actualités.');
    (event.target as HTMLFormElement).reset();
};

console.log("Firebase & UI initialized");

// --- Page Soutenir / Adhérer Interactions ---
document.addEventListener('DOMContentLoaded', () => {
    // Tabs (Soutenir)
    const tabBtns = document.querySelectorAll('#page-soutenir .tab-btn');
    const tabContents = document.querySelectorAll('#page-soutenir .tab-content');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const tabId = btn.getAttribute('data-tab');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === 'tab-' + tabId) {
                        content.classList.add('active');
                    }
                });
            });
        });
    }

    // Domaines bénévolat (Soutenir)
    const domaineChecks = document.querySelectorAll('#page-soutenir .domaine-check');
    if (domaineChecks.length > 0) {
        domaineChecks.forEach(check => {
            check.addEventListener('click', function(e) {
                if ((e.target as HTMLElement).tagName !== 'INPUT') {
                    const input = check.querySelector('input');
                    if (input) {
                        input.checked = !input.checked;
                    }
                }
                const input = check.querySelector('input');
                if (input) {
                    check.classList.toggle('selected', input.checked);
                }
            });
        });
    }
});

declare global {
  interface Window {
    handleAdhesion: (e: Event) => void;
    handleBenevole: (e: Event) => void;
    handlePartenaire: (e: Event) => void;
  }
}

window.handleAdhesion = (event) => {
    event.preventDefault();
    alert('✅ Votre demande d\'adhésion a été envoyée avec succès !\n\nLe Bureau Exécutif examinera votre dossier sous 48h. Vous recevrez une confirmation par téléphone ou email avec les instructions pour retirer votre carte de membre.');
    (event.target as HTMLFormElement).reset();
};

window.handleBenevole = (event) => {
    event.preventDefault();
    const selected = document.querySelectorAll('.domaine-check.selected');
    if (selected.length === 0) {
        alert('⚠️ Veuillez sélectionner au moins un domaine de bénévolat.');
        return;
    }
    alert('✅ Merci pour votre engagement !\n\nVotre candidature de bénévole a été enregistrée. Nous vous contacterons sous 48h pour vous intégrer à nos équipes.');
    (event.target as HTMLFormElement).reset();
    const domaineChecks = document.querySelectorAll('.domaine-check');
    domaineChecks.forEach(c => c.classList.remove('selected'));
};

window.handlePartenaire = (event) => {
    event.preventDefault();
    alert('✅ Votre proposition de partenariat a été envoyée avec succès !\n\nLe Président et le Bureau Exécutif examineront votre proposition et vous recontacteront sous 72h.');
    (event.target as HTMLFormElement).reset();
};

declare global {
  interface Window {
    toggleFaq: (element: HTMLElement) => void;
  }
}

window.toggleFaq = (element: HTMLElement) => {
    const faqItem = element.parentElement;
    if (!faqItem) return;
    
    const isActive = faqItem.classList.contains('active');
    
    // Fermer tous les FAQ
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Ouvrir celui cliqué si il n'était pas actif
    if (!isActive) {
        faqItem.classList.add('active');
    }
};


// Rendu du composant React pour la page Éducation
const eduRoot = document.getElementById('react-education-root');
if (eduRoot) {
    createRoot(eduRoot).render(React.createElement(Education));
}

// Rendu du composant React pour la page Admin Seed
const adminSeedRoot = document.getElementById('react-admin-seed-root');
if (adminSeedRoot) {
    createRoot(adminSeedRoot).render(React.createElement(AdminSeed));
}

// Rendu du composant React pour la page Login
const loginRoot = document.getElementById('react-login-root');
if (loginRoot) {
    createRoot(loginRoot).render(React.createElement(Login));
}

// Rendu du composant React pour la page Dashboard avec Protection
const dashboardRoot = document.getElementById('react-dashboard-root');
if (dashboardRoot) {
    createRoot(dashboardRoot).render(
        React.createElement(ProtectedRoute, null, React.createElement(Dashboard))
    );
}

// Simple Router based on URL
window.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path === '/admin/seed') {
        window.showPage('admin-seed');
    } else if (path === '/login') {
        window.showPage('login');
    } else if (path.startsWith('/dashboard')) {
        window.showPage('dashboard');
    } else {
        // Optionnel : Gérer d'autres routes si nécessaire
    }
});
