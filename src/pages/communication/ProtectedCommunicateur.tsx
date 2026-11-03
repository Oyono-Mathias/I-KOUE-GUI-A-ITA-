import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CommunicateurDashboard } from './CommunicateurDashboard';

export const ProtectedCommunicateur: React.FC = () => {
  const { userData, loading } = useAuth();
  if (loading) {
    return (
      <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center text-bleu-rca font-bold">
        Chargement sécurisé...
      </div>
    );
  }
  if (!userData) return <Navigate to="/login" replace />;
  
  // Accès réservé au communicateur et aux administrateurs techniques.
  const isAllowed = ['communicateur', 'super_admin', 'admin'].includes(userData.role || '');
  if (!isAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <CommunicateurDashboard />;
};

export default ProtectedCommunicateur;
