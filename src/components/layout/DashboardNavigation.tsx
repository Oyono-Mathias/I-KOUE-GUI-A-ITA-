import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Home, Wallet, ArrowLeftRight, Users, CreditCard, HeartHandshake,
  CalendarDays, MessageSquare, FileText, ClipboardList, FolderOpen,
  BriefcaseBusiness, Scale, ChartNoAxesCombined, PieChart, Receipt,
  Newspaper, Megaphone, BarChart3, X, Menu, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './DashboardNavigation.css';

type NavItem = { tab: string; label: string; icon: React.ComponentType<{ size?: number }> };

const navigationByRole: Record<string, { primary: NavItem[]; secondary: NavItem[] }> = {
  tresorier: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'income', label: 'Recettes', icon: Wallet },
      { tab: 'expenses', label: 'Dépenses', icon: ArrowLeftRight },
      { tab: 'dues', label: 'Cotisations', icon: Users }
    ],
    secondary: [
      { tab: 'reports', label: 'Rapports', icon: ChartNoAxesCombined },
      { tab: 'budget', label: 'Budget', icon: PieChart },
      { tab: 'factures', label: 'Factures', icon: Receipt },
      { tab: 'messages', label: 'Messages', icon: MessageSquare }
    ]
  },
  membre: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'carte', label: 'Ma carte', icon: CreditCard },
      { tab: 'cotisations', label: 'Cotisations', icon: Wallet },
      { tab: 'benevolat', label: 'Bénévolat', icon: HeartHandshake }
    ],
    secondary: [
      { tab: 'commissions', label: 'Commissions', icon: Users },
      { tab: 'tasks', label: 'Mes tâches', icon: ClipboardList },
      { tab: 'documents', label: 'Documents', icon: FolderOpen },
      { tab: 'droits', label: 'Mes droits', icon: Scale }
    ]
  },
  president: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'members', label: 'Membres', icon: Users },
      { tab: 'meetings', label: 'Réunions', icon: CalendarDays },
      { tab: 'messages', label: 'Messages', icon: MessageSquare }
    ],
    secondary: [
      { tab: 'expenses', label: 'Dépenses', icon: Wallet },
      { tab: 'content', label: 'Communication', icon: Newspaper },
      { tab: 'notifications', label: 'Notifications', icon: Megaphone },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList },
      { tab: 'reports', label: 'Rapports', icon: BarChart3 }
    ]
  },
  vice_president: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'members', label: 'Membres', icon: Users },
      { tab: 'meetings', label: 'Réunions', icon: CalendarDays },
      { tab: 'messages', label: 'Messages', icon: MessageSquare }
    ],
    secondary: [
      { tab: 'commissions', label: 'Commissions', icon: BriefcaseBusiness },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList },
      { tab: 'objectives', label: 'Objectifs', icon: ChartNoAxesCombined },
      { tab: 'partenaires', label: 'Partenaires', icon: Users },
      { tab: 'reports', label: 'Rapports', icon: FileText },
      { tab: 'expenses', label: 'Dépenses', icon: Wallet }
    ]
  },
  secretaire: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'pv', label: 'Procès-verbaux', icon: FileText },
      { tab: 'convocations', label: 'Réunions', icon: CalendarDays },
      { tab: 'messages', label: 'Messages', icon: MessageSquare }
    ],
    secondary: [
      { tab: 'archives', label: 'Archives', icon: FolderOpen },
      { tab: 'courriers', label: 'Courriers', icon: Receipt },
      { tab: 'commissions', label: 'Commissions', icon: Users },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList },
      { tab: 'members', label: 'Membres', icon: Users },
      { tab: 'moderation', label: 'Modération', icon: Scale }
    ]
  },
  conseiller: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'commission', label: 'Commission', icon: BriefcaseBusiness },
      { tab: 'avis', label: 'Avis', icon: Scale },
      { tab: 'messages', label: 'Messages', icon: MessageSquare }
    ],
    secondary: [
      { tab: 'rapports', label: 'Rapports', icon: FileText },
      { tab: 'partenaires', label: 'Partenaires', icon: Users },
      { tab: 'veille', label: 'Veille', icon: Newspaper },
      { tab: 'tasks', label: 'Tâches', icon: ClipboardList },
      { tab: 'projets', label: 'Projets', icon: BriefcaseBusiness }
    ]
  },
  communicateur: {
    primary: [
      { tab: 'dashboard', label: 'Accueil', icon: Home },
      { tab: 'news', label: 'Actualités', icon: Newspaper },
      { tab: 'calendrier', label: 'Agenda', icon: CalendarDays },
      { tab: 'messages', label: 'Messages', icon: MessageSquare }
    ],
    secondary: [
      { tab: 'board_messages', label: 'Bureau', icon: Users },
      { tab: 'domains', label: 'Domaines', icon: BriefcaseBusiness },
      { tab: 'media', label: 'Médias', icon: FolderOpen },
      { tab: 'analytics', label: 'Statistiques', icon: BarChart3 }
    ]
  }
};

export const DashboardNavigation = () => {
  const { userData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const role = userData?.role || 'membre';
  const normalizedRole = ['super_admin', 'president_fondateur', 'admin'].includes(role) ? 'president' : role;
  const config = navigationByRole[normalizedRole] || navigationByRole.membre;
  const activeTab = searchParams.get('tab') || 'dashboard';

  const navigateToTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next);
    setDrawerOpen(false);
  };

  return (
    <>
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

      {drawerOpen && (
        <div className="global-nav-backdrop" onClick={() => setDrawerOpen(false)}>
          <aside
            id="global-dashboard-drawer"
            className="global-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation de l'espace"
            onClick={event => event.stopPropagation()}
          >
            <div className="global-nav-drawer-head">
              <div><strong>I KOUE GUI A ITA</strong><span>{userData?.displayName || 'Espace personnel'}</span></div>
              <button type="button" aria-label="Fermer le menu" onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <p className="global-nav-section-label">NAVIGATION</p>
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
            <div className="global-nav-drawer-foot">Accès adapté à votre rôle</div>
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
