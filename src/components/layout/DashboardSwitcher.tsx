import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_DEFINITIONS } from '../../constants/roles';
import { ArrowLeftRight, LockKeyhole, ChevronRight } from 'lucide-react';

export const DashboardSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  if (!userData) return null;

  const currentRole = userData.role;
  const isSystemAdmin = ['super_admin', 'admin'].includes(currentRole);
  const currentDefinition = ROLE_DEFINITIONS.find((role) => role.id === currentRole);

  const dashboards = ROLE_DEFINITIONS.filter((role) => {
    if (isSystemAdmin) return true;
    return role.id === currentRole || role.id === 'membre';
  });

  if (dashboards.length <= 1) return null;

  return (
    <div className="fixed right-4 top-[calc(76px+env(safe-area-inset-top))] z-[1000]">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Changer de tableau de bord"
        aria-label="Changer de tableau de bord"
        aria-expanded={isOpen}
      >
        <ArrowLeftRight size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Tableaux de bord autorisés</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{currentDefinition?.label ?? 'Administration'}</p>
          </div>
          <div className="max-h-[min(70vh,32rem)] overflow-y-auto p-2">
            {dashboards.map((role) => {
              const isCurrent = role.id === currentRole;
              const sharedReadOnly = role.dashboardMode === 'shared-readonly';
              const unavailable = role.dashboardMode === 'unavailable' || !role.dashboardPath;
              const disabled = (sharedReadOnly && !isSystemAdmin) || unavailable;
              return (
                <button
                  key={role.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (disabled || !role.dashboardPath) return;
                    navigate(role.dashboardPath);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition ${isCurrent ? 'bg-blue-50 text-blue-800' : disabled ? 'cursor-not-allowed text-slate-400' : 'text-slate-700 hover:bg-slate-50'}`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{role.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {sharedReadOnly ? 'Vue partagée · lecture seule à activer' : role.description}
                    </span>
                  </span>
                  {disabled ? <LockKeyhole size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
            Les vues partagées restent désactivées tant que leur mode lecture seule n’est pas garanti.
          </div>
        </div>
      )}
    </div>
  );
};
