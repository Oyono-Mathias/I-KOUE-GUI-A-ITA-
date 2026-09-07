import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LandingPage } from './pages/public/LandingPage';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import Login from './pages/Login';
import { MemberVoting } from './pages/member/MemberVoting';

import { CommunicateurDashboard } from './pages/communication/CommunicateurDashboard';
import { PresidentDashboard } from './pages/dashboard/PresidentDashboard';
import { VicePresidentDashboard } from './pages/dashboard/VicePresidentDashboard';
import { SecretaireDashboard } from './pages/dashboard/SecretaireDashboard';
import { TresorierDashboard } from './pages/dashboard/TresorierDashboard';
import { ConseillerDashboard } from './pages/dashboard/ConseillerDashboard';

export const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-bleu-rca font-bold">
        Chargement...
      </div>
    );
  }

  return (
    <Routes>
      {/* ESPACE PUBLIC */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      <Route element={<PublicLayout />}>
        {/* Placeholders for public routes */}
        <Route path="/domaines" element={<div className="p-8 text-center text-gray-500">Page Domaines en cours de migration...</div>} />
        <Route path="/a-propos" element={<div className="p-8 text-center text-gray-500">Page À Propos en cours de migration...</div>} />
        <Route path="/contact" element={<div className="p-8 text-center text-gray-500">Page Contact en cours de migration...</div>} />
      </Route>
      
      {/* PAGE DIRECTE COMMUNICATEUR (Design Qwen plein écran) */}
      <Route path="/communicateur" element={<CommunicateurDashboard />} />
      
      {/* ESPACE MEMBRES & ADMIN (DASHBOARD) */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="news" element={<CommunicateurDashboard />} />
        <Route path="communicateur" element={<CommunicateurDashboard />} />
        <Route path="finances" element={<TresorierDashboard />} />
        <Route path="voting" element={<MemberVoting />} />
        <Route path="super_admin" element={<PresidentDashboard />} />
        <Route path="admin_vice_president" element={<VicePresidentDashboard />} />
        <Route path="admin_secretaire" element={<SecretaireDashboard />} />
        <Route path="admin_tresorier" element={<TresorierDashboard />} />
        <Route path="admin_conseiller" element={<ConseillerDashboard />} />
        {/* Placeholder for members */}
        <Route path="members" element={<div className="p-8 text-center text-gray-500">Gestion des membres en cours de migration...</div>} />
      </Route>
      
      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

