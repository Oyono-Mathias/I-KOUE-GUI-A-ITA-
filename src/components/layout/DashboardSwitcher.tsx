import React,{useState} from 'react';
import {useNavigate,useLocation} from 'react-router-dom';
import {LayoutGrid} from 'lucide-react';
import {useAuth} from '../../hooks/useAuth';
import {ROLE_DEFINITIONS,type InstitutionalRole} from '../../constants/roles';
const ROLE_DASHBOARD_PATHS:Record<InstitutionalRole,string>={president_fondateur:'/dashboard',president:'/dashboard',vice_president:'/dashboard/admin_vice_president',secretaire_general:'/dashboard/admin_secretaire',secretaire_adjoint:'/dashboard',tresorier:'/dashboard/admin_tresorier',tresorier_adjoint:'/dashboard',conseiller:'/dashboard/admin_conseiller',commissaire_aux_comptes:'/dashboard',communicateur:'/dashboard/communicateur',membre:'/dashboard/membre'};
export const DashboardSwitcher=()=>{
 const [isOpen,setIsOpen]=useState(false);const navigate=useNavigate();const location=useLocation();const {userData}=useAuth();
 const currentRole=userData?.role||'membre';const canViewAll=['super_admin','president','president_fondateur','admin'].includes(currentRole);
 const authorized=ROLE_DEFINITIONS.filter(role=>canViewAll||role.id===currentRole||role.id==='membre');
 if(authorized.length<=1)return null;
 return <div className="fixed right-4 top-[calc(76px+env(safe-area-inset-top))] z-[99999]">
  <button type="button" onClick={()=>setIsOpen(v=>!v)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-slate-900/85 text-white shadow-lg backdrop-blur-md transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400" title="Changer de tableau de bord" aria-label="Changer de tableau de bord" aria-expanded={isOpen}><LayoutGrid size={19}/></button>
  {isOpen&&<div className="absolute right-0 mt-3 max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
   <div className="px-3 py-2"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tableaux de bord autorisés</p><p className="mt-1 text-xs text-slate-400">{authorized.length} espace(s) disponible(s)</p></div>
   <div className="grid gap-1">{authorized.map(role=>{const Icon=role.icon;const path=ROLE_DASHBOARD_PATHS[role.id];const active=location.pathname===path;return <button key={role.id} type="button" onClick={()=>{navigate(path);setIsOpen(false);}} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${active?'border-blue-200 bg-blue-50':'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 ${role.iconClass}`}><Icon size={19}/></span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{role.label}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{role.description}</span></span><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${role.badgeClass}`}>{active?'Actif':'Ouvrir'}</span>
   </button>})}</div>
  </div>}
 </div>;
};
