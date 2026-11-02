import React from 'react';
import {Banknote,LayoutDashboard,Menu,Users} from 'lucide-react';
import type {DashboardSection} from './DashboardSidebar';
type Props={activeSection:DashboardSection;onNavigate:(section:DashboardSection)=>void;onMenuClick:()=>void};
const items:{id:DashboardSection;label:string;icon:React.ComponentType<{size?:number}>}[]=[{id:'dashboard',label:'Accueil',icon:LayoutDashboard},{id:'members',label:'Membres',icon:Users},{id:'expenses',label:'Dépenses',icon:Banknote}];
export const DashboardBottomNavigation:React.FC<Props>=({activeSection,onNavigate,onMenuClick})=><nav className="shared-bottom-navigation" aria-label="Navigation mobile">{items.map(({id,label,icon:Icon})=><button type="button" key={id} className={activeSection===id?'active':''} aria-current={activeSection===id?'page':undefined} onClick={()=>onNavigate(id)}><Icon size={21}/><span>{label}</span></button>)}<button type="button" onClick={onMenuClick} aria-label="Ouvrir toutes les rubriques"><Menu size={21}/><span>Menu</span></button></nav>;
