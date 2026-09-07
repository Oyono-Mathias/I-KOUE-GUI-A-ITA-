import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Stethoscope, Sprout, Scale, HandHeart, Target } from 'lucide-react';
import { useCollection } from '../../hooks/usePublicData';
import { DomainItem } from '../../types/public';
import { orderBy } from 'firebase/firestore';

const ICONS_MAP: Record<string, React.ReactNode> = {
  'BookOpen': <BookOpen size={32} />,
  'Stethoscope': <Stethoscope size={32} />,
  'Sprout': <Sprout size={32} />,
  'Scale': <Scale size={32} />,
  'HandHeart': <HandHeart size={32} />,
  'Target': <Target size={32} />
};

export default function DomainsPage() {
  const { data: domains, loading, error } = useCollection<DomainItem>('domains', [
    orderBy('order', 'asc')
  ]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-6 sm:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4"
          >
            Nos Domaines d'Intervention
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Conformément à l'Article 7 de nos Statuts, notre association agit activement dans 6 domaines clés pour le développement de la République Centrafricaine.
          </motion.p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg text-center max-w-2xl mx-auto">
            Une erreur est survenue lors du chargement des domaines d'intervention.
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl mb-6"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500">Aucun domaine renseigné pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {domains.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  {ICONS_MAP[domain.iconName] || <Target size={32} />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {domain.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {domain.description}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
