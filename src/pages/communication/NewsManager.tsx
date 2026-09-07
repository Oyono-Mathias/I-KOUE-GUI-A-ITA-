import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Megaphone, Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { EmptyState } from '../../components/ui/EmptyState';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

export const NewsManager = () => {
  const { data: news, loading } = useRealTimeCollection<any>('news');
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'Actualité', imageUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'news'), {
        ...formData,
        date: serverTimestamp()
      });
      setShowAdd(false);
      setFormData({ title: '', description: '', category: 'Actualité', imageUrl: '' });
    } catch (err) {
      alert("Erreur lors de la publication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Supprimer cette actualité du site public ?")) {
      await deleteDoc(doc(db, 'news', id));
    }
  };

  if (loading) return <SkeletonLoader type="list" count={3} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="text-orange-500" /> Gestion des Actualités
        </h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-orange-600">
          <Plus size={18} /> Publier
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <input required type="text" placeholder="Titre de l'actualité" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg text-lg font-bold" />
          <div className="flex gap-4">
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="p-3 border border-gray-200 rounded-lg">
              <option>Actualité</option><option>Événement</option><option>Communiqué</option><option>Humanitaire</option>
            </select>
            <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-lg px-3">
              <ImageIcon size={18} className="text-gray-400" />
              <input type="url" placeholder="URL de l'image (Firebase Storage ou lien public)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full p-2 outline-none" />
            </div>
          </div>
          <textarea required placeholder="Description ou contenu de l'article..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg min-h-[120px]" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-gray-600">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Mettre en ligne</button>
          </div>
        </form>
      )}

      {news.length === 0 ? (
        <EmptyState message="Aucune actualité en ligne. Rédigez le premier article pour le site public !" />
      ) : (
        <div className="grid gap-4">
          {news.sort((a: any, b: any) => b.date?.toMillis() - a.date?.toMillis()).map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
              {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full md:w-48 h-32 object-cover rounded-lg" />}
              <div className="flex-1">
                <span className="text-xs font-bold text-orange-500 uppercase">{item.category}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">{item.title}</h3>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{item.description}</p>
                <div className="text-xs text-gray-400 mt-3">{item.date?.toDate().toLocaleDateString('fr-CF')}</div>
              </div>
              <div className="flex flex-row md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
