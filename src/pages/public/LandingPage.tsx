import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './LandingPage.css';

export const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>({
    heroTitle: 'Agir pour la Solidarité et le Développement en RCA',
    heroSubtitle: 'Promouvoir l\'autonomisation des femmes, l\'agriculture durable et l\'accès à l\'éducation pour les populations vulnérables.',
    aboutHistory: 'L\'Association I KOUE GUI A ITA est une association apolitique, non confessionnelle et sans but lucratif, reconnue d\'utilité publique conformément à la Loi N° 61/233 du 27 Mai 1961.',
    aboutMission: 'Promouvoir la solidarité, l\'autonomisation de la femme, le droit de l\'enfant, l\'environnement, l\'agriculture, l\'élevage, l\'entraide sociale et le développement durable.',
    contactAddress: 'Galabadja II, 8ème Arrondissement\nBangui, RCA',
    contactPhone1: '+236 75 03 08 57',
    contactPhone2: '+236 72 06 12 02',
    contactEmail: 'associationikoueguiaita@gmail.com',
    contactFacebook: 'Association I KOUE GUI A ITA'
  });
  const [domains, setDomains] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState('accueil');

  // Refs for animation
  const revealRefs = useRef<Element[]>([]);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['accueil', 'apropos', 'domaines', 'transparence', 'don', 'contact'];
      let currentSection = 'accueil';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            currentSection = section;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Scroll reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [domains, news, reports]);

  useEffect(() => {
    // Fetch site config
    const unsubConfig = onSnapshot(doc(db, 'site_config', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setSiteConfig(prev => ({ ...prev, ...docSnap.data() }));
      }
    });

    // Fetch domains
    const qDomains = query(collection(db, 'domains'), orderBy('order', 'asc'));
    const unsubDomains = onSnapshot(qDomains, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDomains(data);
    });

    // Fetch news
    // Note: If 'status' requires a composite index that doesn't exist, this might throw an error.
    // If it does, we can filter client side.
    const qNews = query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(3));
    const unsubNews = onSnapshot(qNews, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data = data.filter((n: any) => n.status === 'publie');
      setNews(data);
    });

    // Fetch reports
    const qReports = query(collection(db, 'public_reports'), orderBy('createdAt', 'desc'));
    const unsubReports = onSnapshot(qReports, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReports(data);
    });

    return () => {
      unsubConfig();
      unsubDomains();
      unsubNews();
      unsubReports();
    };
  }, []);

  const submitMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    
    const data = {
      nom: (document.getElementById('memberName') as HTMLInputElement).value,
      email: (document.getElementById('memberEmail') as HTMLInputElement).value,
      telephone: (document.getElementById('memberPhone') as HTMLInputElement).value,
      categorie: (document.getElementById('memberCategory') as HTMLSelectElement).value,
      motivation: (document.getElementById('memberMotivation') as HTMLTextAreaElement).value,
      statut: 'en_attente',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'membership_requests'), data);
      alert('✅ Votre demande de pré-adhésion a été enregistrée avec succès !\n\nLe Bureau Exécutif examinera votre dossier et vous contactera sous 48h.');
      form.reset();
    } catch (error: any) {
      alert('❌ Erreur lors de l\'envoi : ' + error.message);
    }
  };

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const data = {
      name: (document.getElementById('contactName') as HTMLInputElement).value,
      email: (document.getElementById('contactEmail') as HTMLInputElement).value,
      subject: (document.getElementById('contactSubject') as HTMLSelectElement).value,
      message: (document.getElementById('contactMessage') as HTMLTextAreaElement).value,
      status: 'nouveau',
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'contact_messages'), data);
      alert('✅ Votre message a été envoyé avec succès !\n\nNous vous répondrons sous 48h maximum.');
      form.reset();
    } catch (error: any) {
      alert('❌ Erreur lors de l\'envoi : ' + error.message);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const categoryLabels: Record<string, string> = {
    education: '📚 Éducation',
    sante: '🏥 Santé',
    agriculture: '🌱 Agriculture',
    juridique: '⚖️ Juridique',
    humanitaire: '🤝 Humanitaire',
    jeunesse: '🎯 Jeunesse',
    evenement: '🎉 Événement'
  };

  const categoryIcons: Record<string, string> = {
    education: '📚',
    sante: '🏥',
    agriculture: '🌱',
    juridique: '⚖️',
    humanitaire: '🤝',
    jeunesse: '🎯',
    evenement: '🎉'
  };

  const typeLabels: Record<string, string> = {
    activite: '📊 Rapport d\'activités',
    finance_simplifie: '💰 Rapport financier',
    legal: '📜 Document légal'
  };

  return (
    <div className="landing-page-container">
      {/* HEADER */}
      <header className="header" style={{
          background: 'var(--bleu-rca)', color: 'var(--blanc-pur)', padding: '12px 16px', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--shadow-md)'
      }}>
          <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="logo" style={{
                      width: '44px', height: '44px', borderRadius: '50%', background: 'var(--blanc-pur)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--bleu-rca)', fontSize: '14px', border: '2px solid var(--or-solaire)'
                  }}>IK</div>
                  <div className="logo-text">
                      <h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blanc-pur)', margin: 0 }}>I KOUE GUI A ITA</h1>
                      <div className="devise" style={{ fontSize: '9px', color: 'var(--or-solaire)', letterSpacing: '0.5px' }}>ENSEMBLE · VOLONTÉ · ENGAGEMENT</div>
                  </div>
              </div>
              <button className="hamburger" onClick={toggleMenu} aria-label="Menu" style={{
                  background: 'none', border: 'none', color: 'var(--blanc-pur)', fontSize: '24px', cursor: 'pointer', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>☰</button>
          </div>
      </header>

      {/* Mobile menu */}
      <div className={`overlay ${mobileMenuOpen ? 'active' : ''}`} id="overlay" onClick={toggleMenu} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150, display: mobileMenuOpen ? 'block' : 'none'
      }}></div>
      <nav className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`} id="mobileMenu" style={{
          position: 'fixed', top: 0, right: mobileMenuOpen ? '0' : '-100%', width: '85%', maxWidth: '320px', height: '100vh', background: 'var(--blanc-pur)', zIndex: 200, transition: 'right 0.3s ease', overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.2)'
      }}>
          <div className="mobile-menu-header" style={{
              background: 'var(--bleu-rca)', color: 'var(--blanc-pur)', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
              <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="logo" style={{
                      width: '44px', height: '44px', borderRadius: '50%', background: 'var(--blanc-pur)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--bleu-rca)', fontSize: '14px', border: '2px solid var(--or-solaire)'
                  }}>IK</div>
                  <div className="logo-text"><h1 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--blanc-pur)', margin: 0 }}>I KOUE GUI A ITA</h1></div>
              </div>
              <button className="mobile-menu-close" onClick={toggleMenu} style={{
                  background: 'none', border: 'none', color: 'var(--blanc-pur)', fontSize: '28px', cursor: 'pointer', minWidth: '44px', minHeight: '44px'
              }}>✕</button>
          </div>
          <div className="mobile-menu-nav">
              <a href="#accueil" onClick={(e) => scrollToSection(e, 'accueil')} style={{ display: 'flex', padding: '16px 24px', color: activeSection === 'accueil' ? 'var(--bleu-rca)' : 'var(--texte-principal)', textDecoration: 'none', fontSize: '16px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>🏠 Accueil</a>
              <a href="#apropos" onClick={(e) => scrollToSection(e, 'apropos')} style={{ display: 'flex', padding: '16px 24px', color: activeSection === 'apropos' ? 'var(--bleu-rca)' : 'var(--texte-principal)', textDecoration: 'none', fontSize: '16px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>ℹ️ À Propos</a>
              <a href="#domaines" onClick={(e) => scrollToSection(e, 'domaines')} style={{ display: 'flex', padding: '16px 24px', color: activeSection === 'domaines' ? 'var(--bleu-rca)' : 'var(--texte-principal)', textDecoration: 'none', fontSize: '16px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>🌍 Domaines</a>
              <a href="#actualites" onClick={(e) => scrollToSection(e, 'actualites')} style={{ display: 'flex', padding: '16px 24px', color: activeSection === 'actualites' ? 'var(--bleu-rca)' : 'var(--texte-principal)', textDecoration: 'none', fontSize: '16px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>📰 Actualités</a>
              <a href="#transparence" onClick={(e) => scrollToSection(e, 'transparence')} style={{ display: 'flex', padding: '16px 24px', color: activeSection === 'transparence' ? 'var(--bleu-rca)' : 'var(--texte-principal)', textDecoration: 'none', fontSize: '16px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>📊 Transparence</a>
              <a href="#adhesion" onClick={(e) => scrollToSection(e, 'adhesion')} style={{ display: 'flex', padding: '16px 24px', color: activeSection === 'adhesion' ? 'var(--bleu-rca)' : 'var(--texte-principal)', textDecoration: 'none', fontSize: '16px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>📝 Adhérer</a>
              <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} style={{ display: 'flex', padding: '16px 24px', color: activeSection === 'contact' ? 'var(--bleu-rca)' : 'var(--texte-principal)', textDecoration: 'none', fontSize: '16px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>📞 Contact</a>
              <Link to="/login" onClick={toggleMenu} style={{ display: 'flex', padding: '16px 24px', color: 'var(--texte-secondaire)', textDecoration: 'none', fontSize: '13px', borderBottom: '1px solid var(--fond-alterne)', minHeight: '48px', alignItems: 'center', gap: '10px', transition: 'var(--transition)' }}>🔒 Espace Membre</Link>
          </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero-section" id="accueil">
          <span className="badge-legal">Reconnue d'Utilité Publique (Loi N° 61/233)</span>
          <h2 id="heroTitle">{siteConfig.heroTitle}</h2>
          <p className="subtitle" id="heroSubtitle">{siteConfig.heroSubtitle}</p>
          <div className="hero-buttons">
              <a href="#don" className="btn-lp btn-lp-primary">💛 FAIRE UN DON</a>
              <a href="#domaines" className="btn-lp btn-lp-secondary">🌍 NOS DOMAINES</a>
          </div>
      </section>

      {/* STATS */}
      <section className="stats-section">
          <div className="stats-grid">
              <div className="stat-card reveal">
                  <span className="stat-value" data-count="500">500+</span>
                  <span className="stat-label">Bénéficiaires</span>
              </div>
              <div className="stat-card reveal">
                  <span className="stat-value">6</span>
                  <span className="stat-label">Domaines d'action</span>
              </div>
              <div className="stat-card reveal">
                  <span className="stat-value">8ème</span>
                  <span className="stat-label">Arrondissement</span>
              </div>
              <div className="stat-card reveal">
                  <span className="stat-value">100%</span>
                  <span className="stat-label">Transparence</span>
              </div>
          </div>
      </section>

      {/* À PROPOS */}
      <section className="lp-section" id="apropos">
          <div className="lp-container">
              <div className="lp-section-header reveal">
                  <span className="lp-section-eyebrow">Qui sommes-nous</span>
                  <h2 className="lp-section-title">À Propos de Nous</h2>
                  <p className="lp-section-subtitle">Une association au service des populations vulnérables de la République Centrafricaine</p>
              </div>

              <div className="about-card reveal">
                  <h3>📖 Notre Histoire</h3>
                  <p id="aboutHistory">{siteConfig.aboutHistory}</p>
                  <p style={{ marginTop: '12px' }}><strong>Notre devise :</strong> Ensemble – Volonté – Engagement</p>
              </div>

              <div className="mission-box reveal">
                  <h3>🎯 Notre Mission (Article 5)</h3>
                  <p id="aboutMission">{siteConfig.aboutMission}</p>
              </div>

              <div className="lp-section-header reveal" style={{ marginTop: '32px' }}>
                  <h3 className="lp-section-title" style={{ fontSize: '24px' }}>Nos Valeurs</h3>
              </div>

              <div className="values-grid reveal">
                  <div className="value-card">
                      <div className="value-icon">🤝</div>
                      <h4>Solidarité</h4>
                      <p>L'entraide au cœur de nos actions</p>
                  </div>
                  <div className="value-card">
                      <div className="value-icon">🔍</div>
                      <h4>Transparence</h4>
                      <p>Gestion claire et responsable</p>
                  </div>
                  <div className="value-card">
                      <div className="value-icon">💪</div>
                      <h4>Engagement</h4>
                      <p>Détermination sans faille</p>
                  </div>
                  <div className="value-card">
                      <div className="value-icon">🕊️</div>
                      <h4>Paix</h4>
                      <p>Cohésion sociale et vivre-ensemble</p>
                  </div>
              </div>
          </div>
      </section>

      {/* DOMAINES D'INTERVENTION */}
      <section className="lp-section lp-section-alt" id="domaines">
          <div className="lp-container">
              <div className="lp-section-header reveal">
                  <span className="lp-section-eyebrow">Article 7 des Statuts</span>
                  <h2 className="lp-section-title">Nos Domaines d'Intervention</h2>
                  <p className="lp-section-subtitle">Une approche multidimensionnelle pour un impact concret</p>
              </div>

              <div className="domains-grid" id="domainsGrid">
                  {domains.length === 0 ? (
                    <>
                      <div className="skeleton" style={{ height: '200px' }}></div>
                      <div className="skeleton" style={{ height: '200px' }}></div>
                      <div className="skeleton" style={{ height: '200px' }}></div>
                    </>
                  ) : (
                    domains.map((domain, index) => (
                      <div key={domain.id || index} className={`domain-card ${domain.color || ''} reveal`}>
                          <div className="domain-card-header">
                              <div className="domain-icon">{domain.iconName || '🌍'}</div>
                              <div>
                                  <h3>{domain.title}</h3>
                                  <div className="domain-ref">Article 7.{domain.order || (index+1)} des Statuts</div>
                              </div>
                          </div>
                          <div className="domain-card-body">
                              <p>{domain.description}</p>
                              {domain.activities && domain.activities.length > 0 && (
                                  <ul>
                                      {domain.activities.slice(0, 4).map((a: string, i: number) => <li key={i}>{a}</li>)}
                                  </ul>
                              )}
                          </div>
                      </div>
                    ))
                  )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '32px' }} className="reveal">
                  <a href="#contact" className="btn-lp btn-lp-outline">✉️ Nous contacter pour en savoir plus</a>
              </div>
          </div>
      </section>

      {/* ACTUALITÉS */}
      <section className="lp-section" id="actualites">
          <div className="lp-container">
              <div className="lp-section-header reveal">
                  <span className="lp-section-eyebrow">Nos actions</span>
                  <h2 className="lp-section-title">Actualités Récentes</h2>
                  <p className="lp-section-subtitle">Suivez nos actions sur le terrain en temps réel</p>
              </div>

              <div className="news-grid" id="newsGrid">
                {news.length === 0 ? (
                   <>
                    <div className="skeleton" style={{ height: '300px' }}></div>
                    <div className="skeleton" style={{ height: '300px' }}></div>
                    <div className="skeleton" style={{ height: '300px' }}></div>
                  </>
                ) : (
                  news.map((item) => (
                    <div key={item.id} className="news-card reveal">
                        <div className="news-image">
                            {(item.imageUrl || item.image_url) ? (
                              <img src={item.imageUrl || item.image_url} alt={item.title} loading="lazy" />
                            ) : (
                              <span style={{ fontSize: '64px' }}>{categoryIcons[item.category] || '📰'}</span>
                            )}
                            <span className="news-category-badge">{categoryLabels[item.category] || item.category}</span>
                        </div>
                        <div className="news-body">
                            <div className="news-date">📅 {formatDate(item.createdAt)}</div>
                            <h3 className="news-title">{item.title}</h3>
                            <p className="news-desc">{item.description}</p>
                            <a href="#" className="news-link">Lire la suite →</a>
                        </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '32px' }} className="reveal">
                  <a href="#contact" className="btn-lp btn-lp-blue">📰 Voir toutes les actualités</a>
              </div>
          </div>
      </section>

      {/* DONATION / MOBILE MONEY */}
      <section className="donation-section" id="don">
          <h2 className="reveal">💛 Soutenez Nos Actions</h2>
          <p className="reveal">Chaque don, même modeste, fait la différence. Donnez via Mobile Money.</p>

          <div className="mobile-money-grid reveal">
              <div className="mobile-money-card">
                  <div className="provider">🟠 Orange Money</div>
                  <div className="number">{siteConfig.contactPhone1}</div>
                  <div className="name">Association I KOUE GUI A ITA</div>
              </div>
              <div className="mobile-money-card">
                  <div className="provider">🔵 Moov Money</div>
                  <div className="number">{siteConfig.contactPhone2}</div>
                  <div className="name">Association I KOUE GUI A ITA</div>
              </div>
              <div className="mobile-money-card">
                  <div className="provider">🔴 Airtel Money</div>
                  <div className="number">{siteConfig.contactPhone1}</div>
                  <div className="name">Association I KOUE GUI A ITA</div>
              </div>
          </div>

          <a href={`https://wa.me/${siteConfig.contactPhone1?.replace(/\s+/g, '')}?text=Bonjour,%20j'ai%20effectu%C3%A9%20un%20don%20pour%20l'Association%20I%20KOUE%20GUI%20A%20ITA`} className="btn-lp btn-lp-blue reveal" target="_blank" rel="noreferrer" style={{ maxWidth: '400px', margin: '0 auto' }}>
              📱 J'ai effectué mon don - Envoyer la preuve
          </a>
      </section>

      {/* TRANSPARENCE */}
      <section className="lp-section lp-section-alt" id="transparence">
          <div className="lp-container">
              <div className="lp-section-header reveal">
                  <span className="lp-section-eyebrow">Article 12 des Statuts</span>
                  <h2 className="lp-section-title">Transparence & Rapports</h2>
                  <p className="lp-section-subtitle">Une gestion claire et redevable de nos ressources</p>
              </div>

              <div className="reports-grid" id="reportsGrid">
                {reports.length === 0 ? (
                  <>
                    <div className="skeleton" style={{ height: '80px' }}></div>
                    <div className="skeleton" style={{ height: '80px' }}></div>
                    <div className="skeleton" style={{ height: '80px' }}></div>
                  </>
                ) : (
                  reports.map(report => (
                    <div key={report.id} className="report-item">
                        <div className="report-info">
                            <h4>{report.title}</h4>
                            <span>{typeLabels[report.type] || report.type} • {report.size || '-'}</span>
                        </div>
                        <a href={report.url || '#'} className="btn-download" download>⬇ Télécharger</a>
                    </div>
                  ))
                )}
              </div>

              <div className="about-card reveal" style={{ marginTop: '24px', background: '#E3F2FD', borderLeft: '4px solid var(--bleu-ciel)' }}>
                  <p style={{ fontSize: '14px', color: 'var(--bleu-rca)' }}>
                      <strong>ℹ️ Note :</strong> Les rapports d'activités annuels et financiers simplifiés sont publics. Les détails comptables sensibles et les PV internes sont réservés aux membres à jour de cotisation dans l'Espace Membre.
                  </p>
              </div>
          </div>
      </section>

      {/* ADHÉSION */}
      <section className="lp-section" id="adhesion">
          <div className="lp-container">
              <div className="lp-section-header reveal">
                  <span className="lp-section-eyebrow">Article 9 des Statuts</span>
                  <h2 className="lp-section-title">Devenir Membre</h2>
                  <p className="lp-section-subtitle">Rejoignez notre mouvement solidaire</p>
              </div>

              <div className="form-card reveal">
                  <h3 style={{ color: 'var(--bleu-rca)', marginBottom: '16px' }}>📝 Formulaire de Pré-Adhésion</h3>
                  <p style={{ fontSize: '14px', color: 'var(--texte-secondaire)', marginBottom: '20px' }}>
                      Remplissez ce formulaire. Votre demande sera examinée par le Bureau Exécutif sous 48h.
                  </p>

                  <form id="membershipForm" onSubmit={submitMembership}>
                      <div className="lp-form-group">
                          <label>Nom complet <span className="required">*</span></label>
                          <input type="text" id="memberName" required placeholder="Votre nom et prénoms" />
                      </div>

                      <div className="lp-form-group">
                          <label>Email <span className="required">*</span></label>
                          <input type="email" id="memberEmail" required placeholder="votre@email.com" />
                      </div>

                      <div className="lp-form-group">
                          <label>Téléphone <span className="required">*</span></label>
                          <input type="tel" id="memberPhone" required placeholder="+236 ..." />
                      </div>

                      <div className="lp-form-group">
                          <label>Catégorie souhaitée</label>
                          <select id="memberCategory">
                              <option value="actif">Membre Actif</option>
                              <option value="bienfaiteur">Membre Bienfaiteur</option>
                              <option value="honneur">Membre d'Honneur</option>
                          </select>
                      </div>

                      <div className="lp-form-group">
                          <label>Motivation <span className="required">*</span></label>
                          <textarea id="memberMotivation" required placeholder="Pourquoi souhaitez-vous rejoindre l'association ?"></textarea>
                      </div>

                      <div className="checkbox-group">
                          <input type="checkbox" id="acceptStatuts" required />
                          <label htmlFor="acceptStatuts">J'accepte les statuts de l'Association I KOUE GUI A ITA <span className="required">*</span></label>
                      </div>

                      <div className="checkbox-group">
                          <input type="checkbox" id="acceptRI" required />
                          <label htmlFor="acceptRI">Je m'engage à respecter le Règlement Intérieur <span className="required">*</span></label>
                      </div>

                      <button type="submit" className="btn-lp btn-lp-primary btn-lp-block">
                          📤 Soumettre ma demande
                      </button>
                  </form>
              </div>
          </div>
      </section>

      {/* CONTACT */}
      <section className="lp-section lp-section-alt" id="contact">
          <div className="lp-container">
              <div className="lp-section-header reveal">
                  <span className="lp-section-eyebrow">Nous joindre</span>
                  <h2 className="lp-section-title">Contact</h2>
                  <p className="lp-section-subtitle">Nous sommes à votre écoute</p>
              </div>

              <div className="contact-grid reveal">
                  <div className="contact-card">
                      <div className="contact-icon">📍</div>
                      <div>
                          <h4>Siège Social</h4>
                          <p id="contactAddress" style={{ whiteSpace: 'pre-wrap' }}>{siteConfig.contactAddress}</p>
                      </div>
                  </div>

                  <div className="contact-card">
                      <div className="contact-icon">📞</div>
                      <div>
                          <h4>Téléphones</h4>
                          <p>
                              <a href={`tel:${siteConfig.contactPhone1?.replace(/\s+/g, '')}`}>{siteConfig.contactPhone1}</a><br/>
                              <a href={`tel:${siteConfig.contactPhone2?.replace(/\s+/g, '')}`}>{siteConfig.contactPhone2}</a> (WhatsApp)
                          </p>
                      </div>
                  </div>

                  <div className="contact-card">
                      <div className="contact-icon">✉️</div>
                      <div>
                          <h4>Email</h4>
                          <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
                      </div>
                  </div>

                  <div className="contact-card">
                      <div className="contact-icon">🌐</div>
                      <div>
                          <h4>Facebook</h4>
                          <p>{siteConfig.contactFacebook}</p>
                      </div>
                  </div>
              </div>

              <div className="form-card reveal" style={{ marginTop: '32px' }}>
                  <h3 style={{ color: 'var(--bleu-rca)', marginBottom: '16px' }}>💬 Envoyez-nous un message</h3>
                  <form id="contactForm" onSubmit={submitContact}>
                      <div className="lp-form-group">
                          <label>Nom complet <span className="required">*</span></label>
                          <input type="text" id="contactName" required />
                      </div>
                      <div className="lp-form-group">
                          <label>Email <span className="required">*</span></label>
                          <input type="email" id="contactEmail" required />
                      </div>
                      <div className="lp-form-group">
                          <label>Sujet <span className="required">*</span></label>
                          <select id="contactSubject" required>
                              <option value="">-- Choisissez --</option>
                              <option>Demande d'information</option>
                              <option>Partenariat</option>
                              <option>Bénévolat</option>
                              <option>Don</option>
                              <option>Autre</option>
                          </select>
                      </div>
                      <div className="lp-form-group">
                          <label>Message <span className="required">*</span></label>
                          <textarea id="contactMessage" required></textarea>
                      </div>
                      <button type="submit" className="btn-lp btn-lp-blue btn-lp-block">✉️ Envoyer le message</button>
                  </form>
              </div>
          </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{ background: 'var(--bleu-rca)', color: 'var(--blanc-pur)', padding: '40px 20px 100px' }}>
          <div className="footer-grid">
              <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--or-solaire)' }}>I KOUE GUI A ITA</h4>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}><strong>Devise :</strong> Ensemble – Volonté – Engagement</p>
                  <p style={{ marginTop: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap' }}>📍 {siteConfig.contactAddress}</p>
              </div>
              <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--or-solaire)' }}>Liens Rapides</h4>
                  <a href="#accueil" onClick={(e) => scrollToSection(e, 'accueil')} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Accueil</a>
                  <a href="#apropos" onClick={(e) => scrollToSection(e, 'apropos')} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>À Propos</a>
                  <a href="#domaines" onClick={(e) => scrollToSection(e, 'domaines')} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Nos Domaines</a>
                  <a href="#transparence" onClick={(e) => scrollToSection(e, 'transparence')} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Transparence</a>
                  <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>Contact</a>
              </div>
              <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--or-solaire)' }}>Contact</h4>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>📞 {siteConfig.contactPhone1}</p>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>📱 {siteConfig.contactPhone2}</p>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>✉️ {siteConfig.contactEmail}</p>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>🌐 Facebook : {siteConfig.contactFacebook}</p>
              </div>
          </div>
          <div className="footer-bottom" style={{
              borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.6)', maxWidth: '1200px', margin: '0 auto'
          }}>
              <p>© 2026 Association I KOUE GUI A ITA - Conforme à la Loi N° 61/233 du 27 Mai 1961</p>
              <div style={{ marginTop: '12px' }}>
                <Link to="/login" style={{ color: 'rgba(255,255,255,0.6)' }}>🔒 Espace Membre</Link>
                <span style={{ margin: '0 8px' }}>|</span>
                <a href="#mentions-legales" style={{ color: 'rgba(255,255,255,0.6)' }}>Mentions Légales</a>
              </div>
          </div>
      </footer>

      {/* BOTTOM NAV (mobile) */}
      <nav className="bottom-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--blanc-pur)', borderTop: '1px solid var(--bordure)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 90, boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}>
          <a href="#accueil" className={activeSection === 'accueil' ? 'active' : ''} onClick={(e) => scrollToSection(e, 'accueil')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: activeSection === 'accueil' ? 'var(--bleu-rca)' : 'var(--texte-secondaire)', fontSize: '10px', padding: '4px 8px' }}>
              <span className="nav-icon" style={{ fontSize: '22px', marginBottom: '2px', color: activeSection === 'accueil' ? 'var(--or-solaire)' : '' }}>🏠</span>
              <span>Accueil</span>
          </a>
          <a href="#domaines" className={activeSection === 'domaines' ? 'active' : ''} onClick={(e) => scrollToSection(e, 'domaines')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: activeSection === 'domaines' ? 'var(--bleu-rca)' : 'var(--texte-secondaire)', fontSize: '10px', padding: '4px 8px' }}>
              <span className="nav-icon" style={{ fontSize: '22px', marginBottom: '2px', color: activeSection === 'domaines' ? 'var(--or-solaire)' : '' }}>🌍</span>
              <span>Domaines</span>
          </a>
          <a href="#don" className={activeSection === 'don' ? 'active' : ''} onClick={(e) => scrollToSection(e, 'don')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: activeSection === 'don' ? 'var(--bleu-rca)' : 'var(--texte-secondaire)', fontSize: '10px', padding: '4px 8px' }}>
              <span className="nav-icon" style={{ fontSize: '22px', marginBottom: '2px', color: activeSection === 'don' ? 'var(--or-solaire)' : '' }}>💛</span>
              <span>Faire un Don</span>
          </a>
          <a href="#contact" className={activeSection === 'contact' ? 'active' : ''} onClick={(e) => scrollToSection(e, 'contact')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: activeSection === 'contact' ? 'var(--bleu-rca)' : 'var(--texte-secondaire)', fontSize: '10px', padding: '4px 8px' }}>
              <span className="nav-icon" style={{ fontSize: '22px', marginBottom: '2px', color: activeSection === 'contact' ? 'var(--or-solaire)' : '' }}>📞</span>
              <span>Contact</span>
          </a>
      </nav>

      {/* WHATSAPP FAB */}
      <a href={`https://wa.me/${siteConfig.contactPhone2?.replace(/\s+/g, '')}?text=Bonjour,%20je%20souhaite%20en%20savoir%20plus%20sur%20l'Association%20I%20KOUE%20GUI%20A%20ITA`} className="whatsapp-float" target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a>
    </div>
  );
};
