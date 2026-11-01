import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  X, Menu, ChevronRight, UserRound
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './DashboardNavigation.css';

type NavItem = { tab: string; label: string; icon: string };
type RoleNavigation = { primary: NavItem[]; secondary: NavItem[] };

const navigationByRole: Record<string, RoleNavigation> = {
  president: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: '🏠' },
      { tab: 'members', label: 'Membres', icon: '👥' },
      { tab: 'meetings', label: 'Réunions', icon: '📋' },
      { tab: 'expenses', label: 'Dépenses', icon: '💰' }
    ],
    secondary: [
      { tab: 'content', label: 'Contenu', icon: '📝' },
      { tab: 'notifications', label: 'Notifs', icon: '📢' },
      { tab: 'tasks', label: 'Délégation', icon: '📋' },
      { tab: 'reports', label: 'Rapports', icon: '📊' },
      { tab: 'messages', label: 'Chat Bureau', icon: '💬' }
    ]
  },
  secretaire: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: '📊' },
      { tab: 'courriers', label: 'Courriers', icon: '📬' },
      { tab: 'commissions', label: 'Comm.', icon: '🏛️' },
      { tab: 'tasks', label: 'Tâches', icon: '📋' }
    ],
    secondary: [
      { tab: 'messages', label: 'Messages', icon: '💬' },
      { tab: 'archives', label: 'Archives', icon: '🗂️' },
      { tab: 'pv', label: 'PV', icon: '📝' },
      { tab: 'convocations', label: 'Convoc.', icon: '📬' },
      { tab: 'suppleance', label: 'Suppléance', icon: '⚡' },
      { tab: 'members', label: 'Membres', icon: '👥' },
      { tab: 'moderation', label: 'Modération', icon: '🛡️' }
    ]
  },
  conseiller: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: '📊' },
      { tab: 'commission', label: 'Com.', icon: '🏛️' },
      { tab: 'avis', label: 'Avis', icon: '💡' },
      { tab: 'projets', label: 'Projets', icon: '📈' }
    ],
    secondary: [
      { tab: 'messages', label: 'Messages', icon: '💬' },
      { tab: 'rapports', label: 'Rapports', icon: '📄' },
      { tab: 'partenaires', label: 'Partenaires', icon: '🤝' },
      { tab: 'veille', label: 'Veille', icon: '📚' },
      { tab: 'tasks', label: 'Tâches', icon: '📋' },
      { tab: 'suppleance', label: 'Suppléance', icon: '⚡' }
    ]
  },
  vice_president: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: '🏠' },
      { tab: 'tasks', label: 'Tâches', icon: '📋' },
      { tab: 'members', label: 'Membres', icon: '👥' },
      { tab: 'meetings', label: 'Réunions', icon: '📅' }
    ],
    secondary: [
      { tab: 'content', label: 'Contenu', icon: '📝' },
      { tab: 'expenses', label: 'Dépenses', icon: '💰' },
      { tab: 'commissions', label: 'Commissions', icon: '🏛️' },
      { tab: 'objectives', label: 'Objectifs', icon: '🎯' },
      { tab: 'partenaires', label: 'Partenaires', icon: '🤝' },
      { tab: 'conflits', label: 'Conflits', icon: '⚖️' },
      { tab: 'messages', label: 'Messages', icon: '💬' },
      { tab: 'reports', label: 'Rapports', icon: '📊' },
      { tab: 'suppleance', label: 'Suppléance', icon: '⚡' }
    ]
  },
  communicateur: {
    primary: [
      { tab: 'dashboard', label: 'Dashboard', icon: '📊' },
      { tab: 'news', label: 'Actus', icon: '📰' },
      { tab: 'board_messages', label: 'Bureau', icon: '💬' },
      { tab: 'calendrier', label: 'Calendrier', icon: '📅' }
    ],
    secondary: [
      { tab: 'domains', label: 'Domaines', icon: '🌍' },
      { tab: 'landing', label: 'Landing', icon: '🏠' },
      { tab: 'media', label: 'Médias', icon: '🖼️' },
      { tab: 'messages', label: 'Messages', icon: '💬' },
      { tab: 'analytics', label: 'Stats', icon: '📈' }
    ]
  },
  membre: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: '🏠' },
      { tab: 'carte', label: 'Ma Carte', icon: '🎫' },
      { tab: 'cotisations', label: 'Cotisations', icon: '💰' },
      { tab: 'benevolat', label: 'Bénévolat', icon: '🤝' }
    ],
    secondary: [
      { tab: 'commissions', label: 'Commissions', icon: '🏛️' },
      { tab: 'tasks', label: 'Tâches', icon: '📋' },
      { tab: 'documents', label: 'Documents', icon: '📄' },
      { tab: 'droits', label: 'Mes Droits', icon: '⚖️' }
    ]
  },
  tresorier: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: '📊' },
      { tab: 'income', label: 'Recettes', icon: '💵' },
      { tab: 'expenses', label: 'Dépenses', icon: '💸' },
      { tab: 'dues', label: 'Cotisations', icon: '👥' }
    ],
    secondary: [
      { tab: 'factures', label: 'Factures', icon: '🧾' },
      { tab: 'messages', label: 'Messages', icon: '💬' },
      { tab: 'reports', label: 'Rapports', icon: '📊' },
      { tab: 'budget', label: 'Budget', icon: '📋' }
    ]
  }
};

const normalizeRole = (rawRole?: string | null) => {
  if (!rawRole) return '';
  const role = rawRole.trim().toLowerCase();
  if (['super_admin', 'president_fondateur', 'admin', 'admin_bureau'].includes(role)) return 'president';
  if (role === 'treasurer') return 'tresorier';
  if (['member', 'adherent'].includes(role)) return 'membre';
  return role;
};

export const DashboardNavigation = () => {
  const { userData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const authData = userData as (typeof userData & { userRole?: string }) | null;
  const role = normalizeRole(authData?.role || authData?.userRole);
  const config = navigationByRole[role];
  const activeTab = searchParams.get('tab') || 'dashboard';

  useEffect(() => {
    if (!drawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const navigateToTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
    setDrawerOpen(false);
  };

  // Aucun rôle reconnu : ne jamais afficher un menu métier par défaut.
  if (!config) return null;

  const displayName = authData?.displayName || authData?.email || 'Mon compte';
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <>
      <header className="global-dashboard-header">
        <div className="global-header-brand">
          <button
            type="button"
            className="global-nav-trigger"
            aria-label="Ouvrir le menu principal"
            aria-expanded={drawerOpen}
            aria-controls="global-dashboard-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="global-brand-mark" aria-hidden="true">IK</div>
          <div className="global-brand-copy">
            <strong>I KOUE GUI A ITA</strong>
            <span>Espace de gestion associative</span>
          </div>
        </div>
        <div className="global-header-account">
          <span className="global-account-name">{displayName}</span>
          <span className="global-account-avatar" aria-label={`Profil ${displayName}`}><UserRound size={18} />{initials}</span>
        </div>
      </header>

      {drawerOpen && (
        <div className="global-nav-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside
            id="global-dashboard-drawer"
            className="global-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Navigation ${role}`}
            onClick={event => event.stopPropagation()}
          >
            <div className="global-nav-drawer-head">
              <div className="global-drawer-brand">
                <div className="global-brand-mark" aria-hidden="true">IK</div>
                <div><strong>I KOUE GUI A ITA</strong><span>{displayName}</span></div>
              </div>
              <button type="button" aria-label="Fermer le menu" onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <p className="global-nav-section-label">VOTRE ESPACE · {role.replace('_', ' ').toUpperCase()}</p>
            <nav className="global-nav-links">
              {[...config.primary, ...config.secondary].map(item => {
                return (
                  <button type="button" key={item.tab} className={activeTab === item.tab ? 'active' : ''} onClick={() => navigateToTab(item.tab)}>
                    <span className="global-nav-item-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{activeTab === item.tab && <ChevronRight size={16} />}
                  </button>
                );
              })}
            </nav>
            <div className="global-nav-drawer-foot">Navigation réservée à votre espace métier</div>
          </aside>
        </div>
      )}

      <nav className="global-bottom-nav" aria-label="Navigation principale">
        {config.primary.map(item => {
          return (
            <button type="button" key={item.tab} className={activeTab === item.tab ? 'active' : ''} aria-current={activeTab === item.tab ? 'page' : undefined} onClick={() => navigateToTab(item.tab)}>
              <span className="global-nav-item-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
