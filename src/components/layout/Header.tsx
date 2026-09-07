import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Header = () => {
  const { userData } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-bleu-rca text-white shadow-md px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-bleu-rca border-2 border-or-solaire font-bold text-sm shrink-0">
          IK
        </Link>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold leading-tight m-0">I KOUE GUI A ITA</h1>
          <span className="text-[9px] text-or-solaire tracking-wider opacity-90 uppercase">
            Ensemble • Volonté • Engagement
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {userData ? (
          <Link 
            to="/dashboard" 
            className="text-xs bg-or-solaire text-bleu-rca px-3 py-1.5 rounded-lg font-bold hover:bg-yellow-400 transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-1 text-xs border border-white/30 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Connexion</span>
          </Link>
        )}
        <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
};
