import type { UserRole } from '../hooks/useAuth';

export type InstitutionalRole =
  | 'president_fondateur'
  | 'president'
  | 'vice_president'
  | 'secretaire_general'
  | 'secretaire_adjoint'
  | 'tresorier'
  | 'tresorier_adjoint'
  | 'conseiller'
  | 'commissaire_aux_comptes'
  | 'communicateur'
  | 'membre';

export interface RoleDefinition {
  id: InstitutionalRole;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  description: string;
  dashboardPath: string | null;
  dashboardMode: 'dedicated' | 'shared-readonly' | 'unavailable';
}

export const INSTITUTIONAL_ROLES: readonly InstitutionalRole[] = [
  'president_fondateur',
  'president',
  'vice_president',
  'secretaire_general',
  'secretaire_adjoint',
  'tresorier',
  'tresorier_adjoint',
  'conseiller',
  'commissaire_aux_comptes',
  'communicateur',
  'membre',
] as const;

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  { id: 'president_fondateur', label: 'Président Fondateur', shortLabel: 'Fondateur', icon: 'crown', color: 'amber', description: 'Mémoire institutionnelle et archives', dashboardPath: '/dashboard', dashboardMode: 'dedicated' },
  { id: 'president', label: 'Président', shortLabel: 'Président', icon: 'landmark', color: 'blue', description: 'Pilotage et représentation de l’association', dashboardPath: '/dashboard', dashboardMode: 'dedicated' },
  { id: 'vice_president', label: 'Vice-Président', shortLabel: 'Vice-Président', icon: 'handshake', color: 'violet', description: 'Suppléance et coordination exécutive', dashboardPath: '/dashboard/admin_vice_president', dashboardMode: 'dedicated' },
  { id: 'secretaire_general', label: 'Secrétaire Général', shortLabel: 'Secrétaire général', icon: 'clipboard-list', color: 'sky', description: 'Administration, procès-verbaux et archives', dashboardPath: '/dashboard/admin_secretaire', dashboardMode: 'dedicated' },
  { id: 'secretaire_adjoint', label: 'Secrétaire Adjoint', shortLabel: 'Secrétaire adjoint', icon: 'notebook-pen', color: 'cyan', description: 'Vue partagée du secrétariat — lecture seule à activer', dashboardPath: '/dashboard/admin_secretaire', dashboardMode: 'shared-readonly' },
  { id: 'tresorier', label: 'Trésorier', shortLabel: 'Trésorier', icon: 'wallet', color: 'emerald', description: 'Gestion et validation des opérations financières', dashboardPath: '/dashboard/admin_tresorier', dashboardMode: 'dedicated' },
  { id: 'tresorier_adjoint', label: 'Trésorier Adjoint', shortLabel: 'Trésorier adjoint', icon: 'calculator', color: 'teal', description: 'Vue partagée de la trésorerie — lecture seule à activer', dashboardPath: '/dashboard/admin_tresorier', dashboardMode: 'shared-readonly' },
  { id: 'conseiller', label: 'Conseiller', shortLabel: 'Conseiller', icon: 'scale', color: 'slate', description: 'Conseil et accompagnement institutionnel', dashboardPath: '/dashboard/admin_conseiller', dashboardMode: 'dedicated' },
  { id: 'commissaire_aux_comptes', label: 'Commissaire aux Comptes', shortLabel: 'Commissaire aux comptes', icon: 'file-search', color: 'orange', description: 'Vue partagée des finances — lecture seule à activer', dashboardPath: '/dashboard/admin_tresorier', dashboardMode: 'shared-readonly' },
  { id: 'communicateur', label: 'Chargé de Communication', shortLabel: 'Communication', icon: 'megaphone', color: 'pink', description: 'Communication interne et externe', dashboardPath: '/dashboard/communicateur', dashboardMode: 'dedicated' },
  { id: 'membre', label: 'Membre', shortLabel: 'Membre', icon: 'users', color: 'gray', description: 'Espace personnel et activités', dashboardPath: '/dashboard/membre', dashboardMode: 'dedicated' },
] as const;

export const getRoleDefinition = (role: UserRole | string) =>
  ROLE_DEFINITIONS.find((item) => item.id === role);

export const getRoleLabel = (role: UserRole | string) =>
  getRoleDefinition(role)?.label ?? (role === 'super_admin' ? 'Administrateur technique' : role === 'admin' ? 'Administrateur' : 'Rôle non reconnu');
