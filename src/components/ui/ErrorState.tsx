import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: Error | string;
  retry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, retry }) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-red-50 rounded-2xl border border-red-100">
      <AlertOctagon size={48} className="text-red-400 mb-4" />
      <h3 className="text-lg font-bold text-red-800 mb-2">Une erreur est survenue</h3>
      <p className="text-red-600 max-w-md mx-auto mb-6">{errorMessage}</p>
      {retry && (
        <button 
          onClick={retry}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          <RefreshCw size={18} /> Réessayer
        </button>
      )}
    </div>
  );
};
