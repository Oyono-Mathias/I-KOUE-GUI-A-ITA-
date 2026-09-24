import React, { useEffect, useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatusIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowOnline(true);
      const timer = setTimeout(() => {
        setShowOnline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[100] bg-or-solaire text-gray-900 px-4 py-2 text-sm font-medium flex items-center justify-center shadow-md transition-all duration-300"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
        role="alert"
        aria-live="assertive"
      >
        <WifiOff className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-center">Vous êtes hors connexion. Les données disponibles restent accessibles.</span>
      </div>
    );
  }

  if (showOnline) {
    return (
      <div 
        className="fixed top-0 left-0 right-0 z-[100] bg-vert-espoir text-white px-4 py-2 text-sm font-medium flex items-center justify-center shadow-md transition-all duration-300"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-4 h-4 mr-2 flex-shrink-0" />
        <span>Connexion rétablie.</span>
      </div>
    );
  }

  return null;
};
