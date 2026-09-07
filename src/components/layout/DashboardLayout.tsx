import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const DashboardLayout = () => {
  const { userData, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-bleu-rca font-bold">Chargement sécurisé...</div>;
  if (!userData) return <Navigate to="/login" replace />;

  // Tous les tableaux de bord sont désormais des vues autonomes Mobile-First avec leur propre Header et Bottom Nav.
  return <Outlet />;
};
