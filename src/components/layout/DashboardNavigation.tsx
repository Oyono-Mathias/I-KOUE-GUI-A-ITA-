import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Home, Wallet, ArrowLeftRight, Users, CreditCard, HeartHandshake,
  CalendarDays, MessageSquare, FileText, ClipboardList, FolderOpen,
  BriefcaseBusiness, Scale, ChartNoAxesCombined, PieChart, Receipt,
  Newspaper, Megaphone, BarChart3, X, Menu, ChevronRight, UserRound
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './DashboardNavigation.css';

type NavItem = { tab: string; label: string; icon: React.ComponentType<{ size?: number }> };
type RoleNavigation = { primary: NavItem[]; secondary: NavItem[] };

const navigationByRole: Record<string, RoleNavigation> = {
  president: {
    // Priorités reprises dans l'ordre de la barre inférieure de main.
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: Home },
      { tab: 'members', label: 'Membres', icon: Users },
      { tab: 'meetings', label: 'Réunions', icon: CalendarDays },
      { tab: 'expenses', label: 'Dépenses', icon: Wallet }
    ],
    secondary: [
      { tab: 'content', label: 'Contenu', icon: Newspaper },
      { tab: 'notifications', label: 'Notifs', icon: Megaphone },
      { tab: 'tasks', label: 'Délégation', icon: ClipboardList },
      { tab: 'reports', label: 'Rapports', icon: ChartNoAxesCombined },
      { tab: 'messages', label: 'Chat Bureau', icon: MessageSquare }
    ]
  },
  secretaire: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: Home },
      { tab: 'courriers', label: 'Courriers', icon: Receipt },
      { tab: 'commissions', label: 'Comm.', icon: Users },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList }
    ],
    secondary: [
      { tab: 'archives', label: 'Archives', icon: FolderOpen },
      { tab: 'pv', label: 'PV & CR', icon: FileText },
      { tab: 'convocations', label: 'Convocations', icon: CalendarDays },
      { tab: 'suppleance', label: 'Suppléance', icon: BriefcaseBusiness },
      { tab: 'messages', label: 'Messages', icon: MessageSquare },
      { tab: 'members', label: 'Membres', icon: Users },
      { tab: 'moderation', label: 'Modération', icon: Scale }
    ]
  },
  conseiller: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: Home },
      { tab: 'commission', label: 'Com.', icon: BriefcaseBusiness },
      { tab: 'avis', label: 'Avis', icon: Scale },
      { tab: 'projets', label: 'Projets', icon: ChartNoAxesCombined }
    ],
    secondary: [
      { tab: 'rapports', label: 'Rapports', icon: FileText },
      { tab: 'partenaires', label: 'Partenaires', icon: Users },
      { tab: 'veille', label: 'Veille', icon: Newspaper },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList },
      { tab: 'suppleance', label: 'Suppléance', icon: BriefcaseBusiness },
      { tab: 'messages', label: 'Messages', icon: MessageSquare }
    ]
  },
  vice_president: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: Home },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList },
      { tab: 'members', label: 'Membres', icon: Users },
      { tab: 'meetings', label: 'Réunions', icon: CalendarDays }
    ],
    secondary: [
      { tab: 'commissions', label: 'Commissions', icon: BriefcaseBusiness },
      { tab: 'objectives', label: 'Objectifs', icon: ChartNoAxesCombined },
      { tab: 'partenaires', label: 'Partenaires', icon: Users },
      { tab: 'conflits', label: 'Conflits', icon: Scale },
      { tab: 'messages', label: 'Messages', icon: MessageSquare },
      { tab: 'content', label: 'Contenu', icon: Newspaper },
      { tab: 'reports', label: 'Rapports', icon: FileText },
      { tab: 'suppleance', label: 'Suppléance', icon: BriefcaseBusiness },
      { tab: 'expenses', label: 'Dépenses (Suppléance)', icon: Wallet }
    ]
  },
  communicateur: {
    primary: [
      { tab: 'dashboard', label: 'Dashboard', icon: Home },
      { tab: 'news', label: 'Actus', icon: Newspaper },
      { tab: 'board_messages', label: 'Bureau', icon: MessageSquare },
      { tab: 'calendrier', label: 'Calendrier', icon: CalendarDays }
    ],
    secondary: [
      { tab: 'domains', label: 'Domaines', icon: BriefcaseBusiness },
      { tab: 'landing', label: 'Landing', icon: Home },
      { tab: 'media', label: 'Médias', icon: FolderOpen },
      { tab: 'messages', label: 'Public', icon: Megaphone },
      { tab: 'analytics', label: 'Analytics', icon: BarChart3 }
    ]
  },
  membre: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'carte', label: 'Carte', icon: CreditCard },
      { tab: 'cotisations', label: 'Cotisations', icon: Wallet },
      { tab: 'benevolat', label: 'Bénévolat', icon: HeartHandshake }
    ],
    secondary: [
      { tab: 'commissions', label: 'Commissions', icon: Users },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList },
      { tab: 'documents', label: 'Documents', icon: FolderOpen },
      { tab: 'droits', label: 'Vote', icon: Scale }
    ]
  },
  tresorier: {
    primary: [
      { tab: 'dashboard', label: 'Dash', icon: Home },
      { tab: 'income', label: 'Recettes', icon: Wallet },
      { tab: 'expenses', label: 'Dépenses', icon: ArrowLeftRight },
      { tab: 'dues', label: 'Cotisations', icon: Users }
    ],
    secondary: [
      { tab: 'factures', label: 'Factures', icon: Receipt },
      { tab: 'messages', label: 'Messages', icon: MessageSquare },
      { tab: 'reports', label: 'Rapports', icon: ChartNoAxesCombined },
      { tab: 'budget', label: 'Budget', icon: PieChart }
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
                const Icon = item.icon;
                return (
                  <button type="button" key={item.tab} className={activeTab === item.tab ? 'active' : ''} onClick={() => navigateToTab(item.tab)}>
                    <Icon size={18} /><span>{item.label}</span>{activeTab === item.tab && <ChevronRight size={16} />}
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
          const Icon = item.icon;
          return (
            <button type="button" key={item.tab} className={activeTab === item.tab ? 'active' : ''} aria-current={activeTab === item.tab ? 'page' : undefined} onClick={() => navigateToTab(item.tab)}>
              <Icon size={19} /><span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
