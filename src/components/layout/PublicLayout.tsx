import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Outlet } from 'react-router-dom';
import { Home, Globe, Phone, Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const PublicLayout = () => {
  const location = useLocation();

  const navItems = [
    { icon: <Home size={22} />, label: 'Accueil', path: '/' },
    { icon: <Globe size={22} />, label: 'Domaines', path: '/domaines' },
    { icon: <Info size={22} />, label: 'À Propos', path: '/a-propos' },
    { icon: <Phone size={22} />, label: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-[70px] lg:pb-0">
      <Header />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center min-w-[60px] px-2 py-1 transition-colors ${
                isActive ? 'text-bleu-rca' : 'text-gray-400'
              }`}
            >
              <div className={`mb-1 ${isActive ? 'text-or-solaire' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
