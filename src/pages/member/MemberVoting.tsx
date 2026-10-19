import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Vote, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useRealTimeCollection } from '../../hooks/useRealTime';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../firebase';
import { collection, doc, getDoc, serverTimestamp, setDoc, where } from 'firebase/firestore';

export const MemberVoting = () => {
  const { userData, loading: userLoading } = useAuth();
  const { data: openVotes, loading: votesLoading } = useRealTimeCollection<any>('ag_events', [where('status', '==', 'ouvert_au_vote')]);
  const [votedPolls, setVotedPolls] = useState<Record<string, boolean>>({});

  // Check if member is up to date (Art 8 RI)
  const isUpToDate = userData?.statut === 'a_jour' || userData?.statut === 'actif';

  const handleVote = async (pollId: string, choice: 'pour' | 'contre' | 'abstention') => {
    if (!userData?.uid || !isUpToDate) {
      alert("Votre cotisation n'est pas à jour. Vous ne pouvez pas voter (Art. 8 du Règlement Intérieur).");
      return;
    }

    // Identifiant stable : une seule création possible par membre et résolution.
    const voteRef = doc(db, 'votes', `${pollId}_${userData.uid}`);

    try {
      const existingVote = await getDoc(voteRef);
      if (existingVote.exists()) {
        alert("Vous avez déjà voté pour cette résolution.");
        setVotedPolls(previous => ({ ...previous, [pollId]: true }));
        return;
      }

      await setDoc(voteRef, {
        pollId,
        choice,
        memberId: userData.uid,
        timestamp: serverTimestamp()
      });
      setVotedPolls(previous => ({ ...previous, [pollId]: true }));
      alert("Votre vote a été enregistré.");
    } catch (err) {
      console.error("Échec de l'enregistrement du vote :", err);
      alert("Le vote n'a pas pu être enregistré. Vérifiez votre droit de vote ou réessayez.");
    }
  };

  if (userLoading || votesLoading) return <SkeletonLoader type="list" />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Vote size={24} /> Espace de Vote (Assemblée Générale)
        </h2>
        <p className="text-blue-100">Exercez votre droit de vote pour les décisions importantes de l'association.</p>
      </div>

      {!isUpToDate && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-red-800">Droit de vote suspendu</h4>
            <p className="text-red-700 text-sm mt-1">
              Conformément à l'Article 8 du Règlement Intérieur, seuls les membres à jour de leurs cotisations 
              peuvent participer aux votes de l'Assemblée Générale. Veuillez régulariser votre situation auprès du Trésorier.
            </p>
          </div>
        </div>
      )}

      {openVotes.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <Info size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Aucun vote en cours</h3>
          <p className="text-gray-500">Les résolutions soumises au vote apparaîtront ici lors des Assemblées Générales.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {openVotes.map((poll: any) => (
            <div key={poll.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{poll.title || "Résolution N°" + poll.id}</h3>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Ouvert</span>
              </div>
              <p className="text-gray-700 mb-6">{poll.description}</p>
              
              {votedPolls[poll.id] ? (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 font-bold justify-center border border-green-200">
                  <CheckCircle size={20} /> A Voté
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => handleVote(poll.id, 'pour')}
                    disabled={!isUpToDate}
                    className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    POUR
                  </button>
                  <button 
                    onClick={() => handleVote(poll.id, 'contre')}
                    disabled={!isUpToDate}
                    className="flex-1 py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    CONTRE
                  </button>
                  <button 
                    onClick={() => handleVote(poll.id, 'abstention')}
                    disabled={!isUpToDate}
                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ABSTENTION
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
