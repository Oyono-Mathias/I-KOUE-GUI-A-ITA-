const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

const oldContactPage = html.substring(
    html.indexOf('<div class="page" id="page-contact">'),
    html.indexOf('<!-- PAGE MENTIONS LÉGALES -->')
);

const newContactPage = `        <div class="page" id="page-contact">
    <div class="page-header">
        <span class="badge-legal">Siège Social - Galabadja II</span>
        <h2>Contactez-nous</h2>
        <p>Nous sommes à votre écoute pour toute question, proposition de partenariat ou demande d'information sur nos actions en République Centrafricaine.</p>
    </div>

    <div class="breadcrumb">
        <a href="#" onclick="window.showPage('accueil')">Accueil</a> / <strong>Contact</strong>
    </div>

    <!-- COORDONNEES -->
    <section class="section">
        <h2 class="section-title">Nos Coordonnées</h2>
        <p class="section-subtitle">Tous les moyens de nous joindre</p>

        <div class="coord-grid">
            <div class="coord-card">
                <div class="icon blue">📍</div>
                <div>
                    <h3>Siège Social</h3>
                    <p>Galabadja II<br>8ème Arrondissement<br>Bangui, République Centrafricaine</p>
                </div>
            </div>

            <div class="coord-card">
                <div class="icon green">📞</div>
                <div>
                    <h3>Téléphones</h3>
                    <p>
                        <a href="tel:+23675030857">+236 75 03 08 57</a><br>
                        <a href="tel:+23672061202">+236 72 06 12 02</a> (WhatsApp)
                    </p>
                </div>
            </div>

            <div class="coord-card">
                <div class="icon orange">✉️</div>
                <div>
                    <h3>Email</h3>
                    <p><a href="mailto:associationikoueguiaita@gmail.com">associationikoueguiaita@gmail.com</a></p>
                </div>
            </div>

            <div class="coord-card">
                <div class="icon red">👍</div>
                <div>
                    <h3>Facebook</h3>
                    <p><a href="#" target="_blank">Association I KOUE GUI A ITA</a></p>
                </div>
            </div>
        </div>
    </section>

    <!-- HORAIRES -->
    <section class="section section-alt">
        <div class="horaires-box">
            <h3>🕐 Horaires d'Ouverture</h3>
            <ul class="horaires-list">
                <li>
                    <span class="day">Lundi - Vendredi</span>
                    <span class="time">8h00 - 17h00</span>
                </li>
                <li>
                    <span class="day">Samedi</span>
                    <span class="time">9h00 - 13h00</span>
                </li>
                <li class="closed">
                    <span class="day">Dimanche</span>
                    <span class="time">Fermé</span>
                </li>
            </ul>
            <p style="margin-top: 16px; font-size: 13px; opacity: 0.9; position: relative; z-index: 1;">
                💡 WhatsApp disponible 24h/24 pour les urgences humanitaires
            </p>
        </div>
    </section>

    <!-- WHATSAPP DIRECT -->
    <section class="section">
        <div class="whatsapp-direct">
            <h3>💬 Discutez avec nous sur WhatsApp</h3>
            <p>Réponse rapide garantie. Idéal pour les questions urgentes, les dons Mobile Money ou les propositions de bénévolat.</p>
            <a href="https://wa.me/23675030857?text=Bonjour,%20je%20souhaite%20contacter%20l'Association%20I%20KOUE%20GUI%20A%20ITA" class="btn-whatsapp" target="_blank">
                📱 Démarrer une conversation
            </a>
        </div>
    </section>

    <!-- FORMULAIRE -->
    <section class="section section-alt">
        <h2 class="section-title">Envoyez-nous un message</h2>
        <p class="section-subtitle">Nous vous répondrons sous 48h maximum</p>

        <div class="form-container">
            <h3>📝 Formulaire de Contact</h3>
            <p>Tous les champs marqués d'un <span style="color: var(--rouge-solidarite);">*</span> sont obligatoires.</p>

            <form id="contactForm" onsubmit="window.handleContactForm(event)">
                <div class="form-group">
                    <label>Nom complet <span class="required">*</span></label>
                    <input type="text" id="contactNom" required placeholder="Votre nom et prénoms">
                </div>

                <div class="form-group">
                    <label>Email <span class="required">*</span></label>
                    <input type="email" id="contactEmail" required placeholder="votre@email.com">
                </div>

                <div class="form-group">
                    <label>Téléphone</label>
                    <input type="tel" id="contactTel" placeholder="+236 ...">
                </div>

                <div class="form-group">
                    <label>Sujet <span class="required">*</span></label>
                    <select id="contactSujet" required>
                        <option value="">-- Choisissez un sujet --</option>
                        <option>Demande d'information</option>
                        <option>Proposition de partenariat</option>
                        <option>Devenir bénévole</option>
                        <option>Faire un don</option>
                        <option>Devenir membre</option>
                        <option>Demande de rapport / Transparence</option>
                        <option>Urgence humanitaire</option>
                        <option>Autre</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Message <span class="required">*</span></label>
                    <textarea id="contactMessage" required placeholder="Décrivez votre demande en détail..."></textarea>
                </div>

                <button type="submit" class="btn btn-blue"> Envoyer le message</button>
            </form>
        </div>
    </section>

    <!-- MAP -->
    <section class="section">
        <h2 class="section-title">Nous Trouver</h2>
        <p class="section-subtitle">Notre siège à Galabadja II, 8ème Arrondissement de Bangui</p>

        <div class="map-container">
            <div class="map-icon">📍</div>
            <h4>Galabadja II, 8ème Arrondissement</h4>
            <p>Bangui, République Centrafricaine</p>
            <a href="https://maps.google.com/?q=Galabadja+II+Bangui+RCA" class="btn-map" target="_blank">
                🗺️ Ouvrir dans Google Maps
            </a>
        </div>
    </section>

    <!-- FAQ -->
    <section class="section section-alt">
        <h2 class="section-title">Questions Fréquentes</h2>
        <p class="section-subtitle">Les réponses aux questions les plus posées</p>

        <div class="faq-list">
            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>Comment devenir membre de l'association ?</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="faq-answer">
                    <p>Conformément à l'Article 9 des Statuts, vous devez accepter nos statuts, partager nos objectifs, remplir une fiche d'adhésion et vous acquitter des frais d'adhésion. <a href="#" onclick="window.showPage('soutenir')">Rendez-vous sur la page "Faire un Don / Adhérer"</a> pour remplir le formulaire en ligne.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>Comment faire un don ?</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="faq-answer">
                    <p>Vous pouvez faire un don via <strong>Orange Money</strong> (+236 75 03 08 57), <strong>Moov Money</strong> (+236 72 06 12 02) ou <strong>Airtel Money</strong>. Toutes les instructions sont disponibles sur la <a href="#" onclick="window.showPage('soutenir')">page "Faire un Don"</a>. Envoyez ensuite la capture d'écran de la transaction sur WhatsApp.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>Où se trouve votre siège social ?</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="faq-answer">
                    <p>Notre siège social est situé à <strong>Galabadja II, 8ème Arrondissement de Bangui</strong>, République Centrafricaine (Article 2 des Statuts). Nous sommes ouverts du lundi au vendredi de 8h à 17h et le samedi de 9h à 13h.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>Comment devenir bénévole ?</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="faq-answer">
                    <p>Nous accueillons les bénévoles dans nos 6 domaines d'intervention : Éducation, Santé, Agriculture, Juridique, Humanitaire et Jeunesse. <a href="#" onclick="window.showPage('soutenir')">Remplissez le formulaire bénévole</a> ou contactez-nous directement sur WhatsApp au +236 75 03 08 57.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>Comment obtenir vos rapports d'activités ?</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="faq-answer">
                    <p>Tous nos rapports d'activités et financiers sont disponibles en téléchargement sur la <a href="#" onclick="window.showPage('transparence')">page "Transparence"</a>. Conformément à l'Article 16 des Statuts, nous garantissons une gestion transparente et redevable de nos ressources.</p>
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question" onclick="window.toggleFaq(this)">
                    <span>Êtes-vous une association reconnue officiellement ?</span>
                    <span class="arrow">▼</span>
                </div>
                <div class="faq-answer">
                    <p>Oui. L'Association I KOUE GUI A ITA est reconnue d'utilité publique conformément à la <strong>Loi N° 61/233 du 27 Mai 1961</strong> régissant les associations en République Centrafricaine. Nous sommes apolitiques, non confessionnelles et sans but lucratif (Article 4 des Statuts).</p>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
        <h2>Ensemble, construisons une Centrafrique solidaire</h2>
        <p>Votre message est le premier pas vers un engagement concret</p>
        <div class="hero-buttons">
            <a href="#" onclick="window.showPage('soutenir')" class="btn btn-primary">💛 FAIRE UN DON</a>
            <a href="#" onclick="window.showPage('a-propos')" class="btn btn-secondary">ℹ️ NOUS CONNAÎTRE</a>
        </div>
    </section>
        </div>

        `;

html = html.replace(oldContactPage, newContactPage);
fs.writeFileSync('index.html', html);
