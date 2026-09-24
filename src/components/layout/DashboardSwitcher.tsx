import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const DashboardSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();

  const allDashboards = [
    { path: '/dashboard/super_admin', label: '👑 Président', role: 'super_admin' },
    { path: '/dashboard/admin_vice_president', label: '🤝 Vice-Président', role: 'vice_president' },
    { path: '/dashboard/admin_secretaire', label: '📝 Secrétaire', role: 'secretaire' },
    { path: '/dashboard/admin_tresorier', label: '💰 Trésorier', role: 'tresorier' },
    { path: '/dashboard/admin_conseiller', label: '⚖️ Conseiller', role: 'conseiller' },
    { path: '/dashboard/membre', label: '👥 Membre', role: 'membre' }
  ];

  const currentRole = userData?.role || 'membre';
  const isSuper = ['super_admin', 'president', 'president_fondateur', 'admin'].includes(currentRole);

  // Filtrage strict : chaque utilisateur ne voit QUE les tableaux de bord autorisés
  const authorizedDashboards = allDashboards.filter(d => {
    if (isSuper) return true;
    if (d.role === 'membre') return true;
    return d.role === currentRole;
  });

  // Si un membre standard n'a accès qu'à la vue membre, masquer complètement le bouton switcher
  if (authorizedDashboards.length <= 1) {
    return null;
  }

  return (
    <div style={{ position: 'fixed', top: 'calc(16px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', zIndex: 99999 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.15)',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '18px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
          cursor: 'pointer', minHeight: '44px',
          padding: 0
        }}
        title="Changer de vue"
        aria-label="Changer de vue"
      >
        🔄
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '12px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          width: '200px',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '8px 12px', background: '#f8fafc', fontSize: '11px', color: '#64748b', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9' }}>
            TABLEAUX DE BORD AUTORISÉS
          </div>
          {authorizedDashboards.map(d => (
            <button
              key={d.path}
              onClick={() => {
                navigate(d.path);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 12px',
                textAlign: 'left',
                border: 'none',
                background: location.pathname === d.path ? '#eff6ff' : 'transparent',
                color: location.pathname === d.path ? '#1d4ed8' : '#334155',
                fontSize: '13px',
                cursor: 'pointer', minHeight: '44px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: location.pathname === d.path ? '600' : '400'
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
