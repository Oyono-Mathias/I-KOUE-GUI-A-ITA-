import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { CommunicateurDashboard } from '../communication/CommunicateurDashboard';
import { PresidentDashboard } from './PresidentDashboard';
import { VicePresidentDashboard } from './VicePresidentDashboard';
import { SecretaireDashboard } from './SecretaireDashboard';
import { TresorierDashboard } from './TresorierDashboard';
import { ConseillerDashboard } from './ConseillerDashboard';
import { MemberDashboard } from './MemberDashboard';
import { Navigate } from 'react-router-dom';

export const DashboardHome = () => {
  const { userData } = useAuth();
  
  if (userData?.role === 'communicateur') {
    return <CommunicateurDashboard />;
  }

  if (userData?.role === 'tresorier') {
    return <TresorierDashboard />;
  }

  if (userData?.role === 'conseiller') {
    return <ConseillerDashboard />;
  }

  if (userData?.role === 'super_admin') {
    return <PresidentDashboard />;
  }

  if (userData?.role === 'vice_president') {
    return <VicePresidentDashboard />;
  }

  if (userData?.role === 'secretaire') {
    return <SecretaireDashboard />;
  }
  
  return <MemberDashboard />;
};
