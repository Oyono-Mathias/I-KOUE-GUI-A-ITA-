import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NetworkStatusIndicator } from './components/layout/NetworkStatusIndicator';

// Chargement dynamique (lazy loading) des pages publiques et layouts
const LandingPage = lazy(() => import('./pages/public/LandingPage').then(m => ({ default: m.LandingPage })));
const Login = lazy(() => import('./pages/Login'));
const PublicLayout = lazy(() => import('./components/layout/PublicLayout').then(m => ({ default: m.PublicLayout })));
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout').then(m => ({ default: m.DashboardLayout })));

// Chargement dynamique (lazy loading) de la garde communicateur
const ProtectedCommunicateur = lazy(() => import('./pages/communication/ProtectedCommunicateur'));

// Chargement dynamique (lazy loading) des dashboards et pages lourdes
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome').then(m => ({ default: m.DashboardHome })));
const MemberVoting = lazy(() => import('./pages/member/MemberVoting').then(m => ({ default: m.MemberVoting })));
const CommunicateurDashboard = lazy(() => import('./pages/communication/CommunicateurDashboard').then(m => ({ default: m.CommunicateurDashboard })));
const PresidentDashboard = lazy(() => import('./pages/dashboard/PresidentDashboard').then(m => ({ default: m.PresidentDashboard })));
const VicePresidentDashboard = lazy(() => import('./pages/dashboard/VicePresidentDashboard').then(m => ({ default: m.VicePresidentDashboard })));
const SecretaireDashboard = lazy(() => import('./pages/dashboard/SecretaireDashboard').then(m => ({ default: m.SecretaireDashboard })));
const TresorierDashboard = lazy(() => import('./pages/dashboard/TresorierDashboard').then(m => ({ default: m.TresorierDashboard })));
const ConseillerDashboard = lazy(() => import('./pages/dashboard/ConseillerDashboard').then(m => ({ default: m.ConseillerDashboard })));
const MemberDashboard = lazy(() => import('./pages/dashboard/MemberDashboard').then(m => ({ default: m.MemberDashboard })));

const PageLoading = () => (
  <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center bg-gray-50 text-bleu-rca font-bold">
    Chargement...
  </div>
);

export const App = () => {
  return (
    <>
      <NetworkStatusIndicator />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* ESPACE PUBLIC (Rendu immédiat sans blocage Auth) */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<PublicLayout />}>
            {/* Placeholders for public routes */}
            <Route path="/domaines" element={<div className="p-8 text-center text-gray-500">Page Domaines en cours de migration...</div>} />
            <Route path="/a-propos" element={<div className="p-8 text-center text-gray-500">Page À Propos en cours de migration...</div>} />
            <Route path="/contact" element={<div className="p-8 text-center text-gray-500">Page Contact en cours de migration...</div>} />
          </Route>
          
          {/* PAGE DIRECTE COMMUNICATEUR (Protégée) */}
          <Route path="/communicateur" element={<ProtectedCommunicateur />} />
          
          {/* ESPACE MEMBRES & ADMIN (DASHBOARD) - Protection stricte via DashboardLayout */}
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
            <Route path="membre" element={<MemberDashboard />} />
            {/* Placeholder for members */}
            <Route path="members" element={<div className="p-8 text-center text-gray-500">Gestion des membres en cours de migration...</div>} />
          </Route>
          
          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

