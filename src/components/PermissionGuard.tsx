import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
  requiredRole?: string;
  allowedRoles?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  requiredRole, 
  allowedRoles, 
  children, 
  fallback = null 
}) => {
  const { role, loading } = usePermissions();

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Vérification des droits d'accès...</div>;
  }

  // Si on vérifie un seul rôle spécifique
  if (requiredRole && role !== requiredRole) {
    // Si l'utilisateur est admin ou super_admin, on lui donne le passe-droit global
    if (role !== 'admin' && role !== 'super_admin' && role !== 'president' && role !== 'president_fondateur') {
      return <>{fallback}</>;
    }
  }

  // Si on vérifie une liste de rôles
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Passe-droit global
    if (role !== 'admin' && role !== 'super_admin' && role !== 'president' && role !== 'president_fondateur') {
        return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
