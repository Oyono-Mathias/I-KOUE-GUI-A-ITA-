import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Banknote, TrendingUp, TrendingDown, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { ErrorState } from '../../components/ui/ErrorState';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';

export const TreasurerDashboard = () => {
  const { userData } = useAuth();
  const { data: finances, loading, error } = useRealTimeCollection<any>('finances');
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ amount: '', type: 'depense', description: '', category: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <SkeletonLoader type="card" count={4} />;
  if (error) return <ErrorState error={error} />;

  // Statistiques
  const recettes = finances.filter(f => f.type === 'recette' && f.status !== 'rejeté').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const depenses = finances.filter(f => f.type === 'depense' && f.status === 'approuvé').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const depensesEnAttente = finances.filter(f => f.type === 'depense' && f.status === 'en_attente').reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const solde = recettes - depenses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);
      const requiresSignature = formData.type === 'depense' && amount > 50000;

      await addDoc(collection(db, 'finances'), {
        amount,
        type: formData.type,
        description: formData.description,
        category: formData.category,
        createdBy: userData?.uid,
        createdAt: serverTimestamp(),
        // Article 16 : Dépense majeure requiert la signature du Président
        status: requiresSignature ? 'en_attente' : 'approuvé',
        requiresPresidentSignature: requiresSignature,
      });

      alert(requiresSignature ? 'Dépense > 50000 FCFA soumise pour validation au Président (Art. 16).' : 'Transaction enregistrée avec succès.');
      setFormData({ amount: '', type: 'depense', description: '', category: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement de la transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord financier</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700"
        >
          <Banknote size={18} /> Nouvelle Transaction
        </button>
      </div>

      {showAddForm && (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Type de transaction</label>
              <select 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg"
              >
                <option value="depense">Dépense (Sortie)</option>
                <option value="recette">Recette (Entrée)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Montant (FCFA)</label>
              <input 
                type="number" 
                required 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Motif / Description</label>
              <input 
                type="text" 
                required 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-200 rounded-lg"
                placeholder="Ex: Achat de fournitures..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 font-semibold">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
              Enregistrer
            </button>
          </div>
        </motion.form>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Solde Actuel</p>
            <p className="text-3xl font-bold text-gray-900">{solde.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Banknote size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Recettes (Validées)</p>
            <p className="text-2xl font-bold text-green-600">{recettes.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium">Dépenses (Validées)</p>
            <p className="text-2xl font-bold text-red-600">{depenses.toLocaleString('fr-FR')} FCFA</p>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      {depensesEnAttente > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertCircle className="text-orange-500 shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-orange-800">Dépenses en attente de cosignature</h4>
            <p className="text-orange-700 text-sm">{depensesEnAttente.toLocaleString('fr-FR')} FCFA nécessitent l'approbation du Président (dépenses supérieures à 50 000 FCFA).</p>
          </div>
        </div>
      )}

      {/* Historique Récent */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">Historique des transactions</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {finances.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune transaction enregistrée.</div>
          ) : finances.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).map((t: any) => (
            <div key={t.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'recette' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {t.type === 'recette' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{t.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{t.createdAt?.toDate().toLocaleDateString('fr-CF')}</span>
                    {t.status === 'en_attente' && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Attente Président</span>}
                  </div>
                </div>
              </div>
              <div className={`font-bold ${t.type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'recette' ? '+' : '-'}{t.amount?.toLocaleString('fr-FR')} FCFA
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
