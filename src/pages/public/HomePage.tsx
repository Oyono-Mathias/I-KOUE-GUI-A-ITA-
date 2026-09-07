import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Heart, Users } from 'lucide-react';
import { useCollection } from '../../hooks/usePublicData';
import { NewsItem } from '../../types/public';
import { limit, orderBy } from 'firebase/firestore';

export default function HomePage() {
  const { data: latestNews, loading, error } = useCollection<NewsItem>('news', [
    orderBy('date', 'desc'),
    limit(3)
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white pt-24 pb-16 px-6 sm:px-12 lg:px-24 flex flex-col items-center text-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0 opacity-5" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-orange-100 text-orange-600 font-semibold text-sm mb-6">
            République Centrafricaine
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            Association <span className="text-blue-600">I KOUE GUI A ITA</span>
          </h1>
          <h2 className="text-xl md:text-2xl text-gray-600 italic mb-10">
            "Ensemble · Volonté · Engagement"
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
              <Users size={20} />
              Devenir Membre
            </button>
            <button className="flex items-center justify-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200">
              <Heart size={20} />
              Faire un Don
            </button>
          </div>
        </div>
      </motion.section>

      {/* Aperçu des activités */}
      <section className="py-16 px-6 sm:px-12 lg:px-24 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="text-3xl font-bold text-gray-900">Nos dernières actions</h3>
            <p className="text-gray-600 mt-2">Découvrez l'impact de nos actions sur le terrain.</p>
          </div>
          <button className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800">
            Voir tout <ArrowRight size={16} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            Impossible de charger les actualités pour le moment.
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
                <div className="w-full h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : latestNews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-gray-500">Aucune actualité disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestNews.map((news, index) => (
              <motion.div 
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col"
              >
                {news.imageUrl && (
                  <img 
                    src={news.imageUrl} 
                    alt={news.title} 
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">
                    {news.category}
                  </span>
                  <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {news.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                    {news.description}
                  </p>
                  <div className="text-xs text-gray-400 mt-auto pt-4 border-t border-gray-100">
                    {news.date ? new Date(news.date.toDate()).toLocaleDateString('fr-CF') : ''}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <button className="md:hidden w-full mt-8 flex items-center justify-center gap-2 text-blue-600 font-semibold bg-blue-50 py-3 rounded-xl">
          Voir toutes les actualités <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}
