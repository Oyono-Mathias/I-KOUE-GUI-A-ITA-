import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, getDoc, limit, onSnapshot,
  query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';

interface NewsInteractionsProps { newsId: string; title: string; }
interface NewsComment { id: string; authorUid: string; authorName: string; text: string; status: 'pending' | 'approved' | 'rejected'; createdAt?: any; }
let anonymousSignIn: Promise<User> | null = null;
async function getInteractionUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  if (!anonymousSignIn) anonymousSignIn = signInAnonymously(auth).then((credential) => credential.user).finally(() => { anonymousSignIn = null; });
  return anonymousSignIn;
}
const dateLabel = (value: any) => {
  try { const date = value?.toDate ? value.toDate() : new Date(value); return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

export const NewsInteractions: React.FC<NewsInteractionsProps> = ({ newsId, title }) => {
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [authorName, setAuthorName] = useState('Visiteur');
  const [isCommunicator, setIsCommunicator] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [pendingComments, setPendingComments] = useState<NewsComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => onAuthStateChanged(auth, async (user) => {
    setUid(user?.uid || null); setIsCommunicator(false);
    setAuthorName(user?.displayName?.trim() || 'Visiteur');
    if (!user || user.isAnonymous) return;
    try {
      const profile = await getDoc(doc(db, 'users', user.uid));
      if (auth.currentUser?.uid !== user.uid || !profile.exists()) return;
      const data = profile.data();
      setAuthorName(user.displayName || data.displayName || data.nom || 'Membre');
      setIsCommunicator(data.role === 'communicateur' && data.statut !== 'suspendu' && data.status !== 'suspendu');
    } catch (error) { console.warn('Impossible de vérifier le rôle éditorial:', error); }
  }), []);

  useEffect(() => onSnapshot(collection(db, 'news', newsId, 'likes'), (snapshot) => {
    setLikeCount(snapshot.size); setLiked(Boolean(uid && snapshot.docs.some((item) => item.id === uid)));
  }, (error) => console.warn('Lecture des réactions impossible:', error)), [newsId, uid]);

  useEffect(() => {
    const publicComments = query(collection(db, 'news', newsId, 'comments'), where('status', '==', 'approved'), limit(50));
    return onSnapshot(publicComments, (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as NewsComment));
      items.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setComments(items);
    }, (error) => console.warn('Lecture des commentaires publics impossible:', error));
  }, [newsId]);

  useEffect(() => {
    if (!isCommunicator) { setPendingComments([]); return; }
    const pending = query(collection(db, 'news', newsId, 'comments'), where('status', '==', 'pending'), limit(100));
    return onSnapshot(pending, (snapshot) => setPendingComments(snapshot.docs.map((item) => ({ id:item.id, ...item.data() } as NewsComment))),
      (error) => console.warn('File de modération indisponible:', error));
  }, [newsId, isCommunicator]);

  const sortedComments = useMemo(() => comments, [comments]);
  const toggleLike = async () => {
    setFeedback('');
    try { const user = await getInteractionUser(); const ref = doc(db,'news',newsId,'likes',user.uid); if(liked) await deleteDoc(ref); else await setDoc(ref,{uid:user.uid,createdAt:serverTimestamp()}); }
    catch(error){ console.error('Impossible d’enregistrer la réaction:',error); setFeedback('Votre réaction n’a pas pu être enregistrée. Réessayez.'); }
  };
  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault(); const text=commentText.trim(); if(!text||text.length>1000||submitting)return;
    setSubmitting(true); setFeedback('');
    try { const user=await getInteractionUser(); await addDoc(collection(db,'news',newsId,'comments'),{
      authorUid:user.uid, authorName:(authorName||user.displayName||'Visiteur').slice(0,80), text, status:'pending', createdAt:serverTimestamp(),
    }); setCommentText(''); setFeedback('Merci ! Votre commentaire sera visible après validation par le Communicateur.'); }
    catch(error){ console.error('Impossible d’envoyer le commentaire:',error); setFeedback('Le commentaire n’a pas pu être envoyé. Vérifiez votre connexion et réessayez.'); }
    finally { setSubmitting(false); }
  };
  const shareNews = async () => {
    const url=window.location.origin+window.location.pathname+'#actualites-'+encodeURIComponent(newsId);
    const data={title,text:'Découvrez cette actualité de l’association I KOUE GUI A ITA.',url};
    try { if(navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(url); setFeedback('Lien de l’actualité copié.'); } }
    catch(error:any){ if(error?.name!=='AbortError'){try{await navigator.clipboard.writeText(url);setFeedback('Lien de l’actualité copié.');}catch{setFeedback('Le partage n’est pas disponible sur cet appareil.');}} }
  };
  const moderate = async (comment:NewsComment,status:'approved'|'rejected') => {
    try { const user=await getInteractionUser(); await updateDoc(doc(db,'news',newsId,'comments',comment.id),{status,moderatedAt:serverTimestamp(),moderatedBy:user.uid}); }
    catch(error){console.error('Action de modération refusée:',error);setFeedback('Action non autorisée ou indisponible.');}
  };

  return <section className="news-interactions" aria-label="Réactions et commentaires">
    <div className="news-interactions__actions">
      <button type="button" onClick={toggleLike} aria-pressed={liked} className={liked?'is-liked':''}><span aria-hidden="true">{liked?'♥':'♡'}</span> {likeCount} J’aime</button>
      <button type="button" onClick={shareNews}><span aria-hidden="true">↗</span> Partager</button>
      <span className="news-interactions__privacy">Visiteurs bienvenus · sans création de compte</span>
    </div>
    <div className="news-interactions__comments">
      <h4>Commentaires ({sortedComments.length})</h4>
      {sortedComments.length===0?<p className="news-interactions__empty">Soyez le premier à commenter cette actualité.</p>:<ul>{sortedComments.map(comment=><li key={comment.id}><strong>{comment.authorName||'Visiteur'}</strong><time>{dateLabel(comment.createdAt)}</time><p>{comment.text}</p></li>)}</ul>}
      <form onSubmit={submitComment}>
        <label htmlFor={'news-comment-'+newsId}>Votre commentaire</label>
        <textarea id={'news-comment-'+newsId} value={commentText} onChange={event=>setCommentText(event.target.value)} placeholder="Partagez votre réaction…" maxLength={1000} rows={3}/>
        <div className="news-interactions__form-footer"><small>{commentText.length}/1000 · publication après modération</small><button type="submit" disabled={!commentText.trim()||submitting}>{submitting?'Envoi…':'Envoyer'}</button></div>
      </form>
      {feedback&&<p className="news-interactions__feedback" role="status">{feedback}</p>}
    </div>
    {isCommunicator&&<div className="news-moderation">
      <div className="news-moderation__heading"><h4>Modération · {pendingComments.length} en attente</h4><span>Réservé au Communicateur</span></div>
      {pendingComments.length===0?<p className="news-interactions__empty">Aucun commentaire à valider.</p>:pendingComments.map(comment=><article key={comment.id} className="news-moderation__item">
        <div><strong>{comment.authorName||'Visiteur'}</strong><time>{dateLabel(comment.createdAt)}</time></div><p>{comment.text}</p>
        <div className="news-moderation__buttons"><button type="button" onClick={()=>moderate(comment,'approved')}>Valider</button><button type="button" onClick={()=>moderate(comment,'rejected')}>Refuser</button></div>
      </article>)}
    </div>}
  </section>;
};
