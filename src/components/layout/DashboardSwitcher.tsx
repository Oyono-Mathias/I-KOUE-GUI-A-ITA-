import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const DashboardSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const dashboards = [
    { path: '/dashboard/super_admin', label: '👑 Président', role: 'super_admin' },
    { path: '/dashboard/admin_vice_president', label: '🤝 Vice-Président', role: 'vice_president' },
    { path: '/dashboard/admin_secretaire', label: '📝 Secrétaire', role: 'secretaire' },
    { path: '/dashboard/admin_tresorier', label: '💰 Trésorier', role: 'tresorier' },
    { path: '/dashboard/admin_conseiller', label: '⚖️ Conseiller', role: 'conseiller' },
    { path: '/dashboard/membre', label: '👥 Membre', role: 'membre' }
  ];

  return (
    <div style={{ position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e0e0e0',
          padding: '6px 12px',
          borderRadius: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#1a365d',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backdropFilter: 'blur(4px)'
        }}
      >
        🔄 Changer de vue
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          width: '200px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '8px 12px', background: '#f8fafc', fontSize: '11px', color: '#64748b', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9' }}>
            TEST / NAVIGATION RAPIDE
          </div>
          {dashboards.map(d => (
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
                cursor: 'pointer',
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
