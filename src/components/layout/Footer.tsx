import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useRealTimeDocument } from '../../hooks/useRealTime';

export const Footer = () => {
  const { data: siteConfig } = useRealTimeDocument<any>('site_config', 'main');

  const contactAddress = siteConfig?.contactAddress || 'Galabadja II, 8ème Arr., Bangui';
  const contactPhone1 = siteConfig?.contactPhone1 || '+236 75 03 08 57';
  const contactPhone2 = siteConfig?.contactPhone2 || '+236 72 06 12 02';
  const contactEmail = siteConfig?.contactEmail || 'associationikoueguiaita@gmail.com';

  return (
    <footer className="bg-bleu-rca text-white pt-12 pb-24 lg:pb-12 px-6 mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
          <h4 className="text-or-solaire font-bold uppercase tracking-wider mb-4">I KOUE GUI A ITA</h4>
          <p className="text-white/80 text-sm leading-relaxed mb-4">
            {siteConfig?.aboutMission || "Promouvoir la solidarité, l'autonomisation et le développement durable en République Centrafricaine."}
          </p>
        </div>
        <div>
          <h4 className="text-or-solaire font-bold uppercase tracking-wider mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-white/80">
            <li className="flex items-center gap-2"><MapPin size={16} /> {contactAddress}</li>
            <li className="flex items-center gap-2"><Phone size={16} /> {contactPhone1} {contactPhone2 ? `/ ${contactPhone2}` : ''}</li>
            <li className="flex items-center gap-2"><Mail size={16} /> {contactEmail}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-or-solaire font-bold uppercase tracking-wider mb-4">Liens Rapides</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link to="/domaines" className="hover:text-or-solaire transition-colors">Nos Domaines</Link></li>
            <li><Link to="/a-propos" className="hover:text-or-solaire transition-colors">À Propos</Link></li>
            <li><Link to="/contact" className="hover:text-or-solaire transition-colors">Nous Contacter</Link></li>
            <li><Link to="/login" className="hover:text-or-solaire transition-colors">Espace Membre</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto text-center border-t border-white/20 pt-6 text-xs text-white/60">
        © {new Date().getFullYear()} Association I KOUE GUI A ITA. Tous droits réservés.
      </div>
    </footer>
  );
};
