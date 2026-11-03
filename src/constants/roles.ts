import { BadgeCheck, BriefcaseBusiness, Calculator, FileText, Landmark, Megaphone, Scale, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
export const INSTITUTIONAL_ROLES = ['president_fondateur','president','vice_president','secretaire_general','secretaire_adjoint','tresorier','tresorier_adjoint','conseiller','commissaire_aux_comptes','communicateur','membre'] as const;
export type InstitutionalRole = typeof INSTITUTIONAL_ROLES[number];
export type LegacyRole = 'secretaire' | 'admin_bureau';
export type SystemRole = 'super_admin' | 'admin';
export type UserRole = InstitutionalRole | LegacyRole | SystemRole;
export interface RoleDefinition { id: InstitutionalRole; label: string; description: string; icon: LucideIcon; badgeClass: string; iconClass: string; }
export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
{ id:'president_fondateur',label:'Président-Fondateur',description:'Rôle honorifique, stratégique et de mémoire institutionnelle.',icon:Landmark,badgeClass:'bg-amber-100 text-amber-800',iconClass:'text-amber-700' },
{ id:'president',label:'Président',description:'Dirige et représente l’association selon les statuts.',icon:ShieldCheck,badgeClass:'bg-blue-100 text-blue-800',iconClass:'text-blue-700' },
{ id:'vice_president',label:'Vice-Président',description:'Assiste le Président et assure son remplacement statutaire.',icon:BriefcaseBusiness,badgeClass:'bg-violet-100 text-violet-800',iconClass:'text-violet-700' },
{ id:'secretaire_general',label:'Secrétaire Général',description:'Coordonne le secrétariat, les procès-verbaux et les archives.',icon:FileText,badgeClass:'bg-sky-100 text-sky-800',iconClass:'text-sky-700' },
{ id:'secretaire_adjoint',label:'Secrétaire Adjoint',description:'Assiste le Secrétaire Général dans ses missions.',icon:FileText,badgeClass:'bg-cyan-100 text-cyan-800',iconClass:'text-cyan-700' },
{ id:'tresorier',label:'Trésorier',description:'Gère les finances et valide les opérations selon les permissions.',icon:Calculator,badgeClass:'bg-emerald-100 text-emerald-800',iconClass:'text-emerald-700' },
{ id:'tresorier_adjoint',label:'Trésorier Adjoint',description:'Assiste le Trésorier sans validation financière autonome.',icon:Calculator,badgeClass:'bg-teal-100 text-teal-800',iconClass:'text-teal-700' },
{ id:'conseiller',label:'Conseiller',description:'Apporte conseil et expertise au bureau exécutif.',icon:Scale,badgeClass:'bg-slate-100 text-slate-800',iconClass:'text-slate-700' },
{ id:'commissaire_aux_comptes',label:'Commissaire aux Comptes',description:'Exerce un contrôle financier en lecture seule.',icon:BadgeCheck,badgeClass:'bg-orange-100 text-orange-800',iconClass:'text-orange-700' },
{ id:'communicateur',label:'Communicateur',description:'Pilote la communication interne et externe.',icon:Megaphone,badgeClass:'bg-pink-100 text-pink-800',iconClass:'text-pink-700' },
{ id:'membre',label:'Membre',description:'Accède à son espace personnel et à ses informations.',icon:Users,badgeClass:'bg-gray-100 text-gray-800',iconClass:'text-gray-700' }
];
