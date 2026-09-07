import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';

export function useRealTimeDocument<T>(collectionName: string, docId: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const unsubscribe = onSnapshot(doc(db, collectionName, docId), 
        (docSnap) => {
          if (docSnap.exists()) {
            setData({ id: docSnap.id, ...docSnap.data() } as T);
          } else {
            setData(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error(`Erreur onSnapshot sur ${collectionName}/${docId}:`, err);
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [collectionName, docId]);

  return { data, loading, error };
}

export function useRealTimeCollection<T>(collectionName: string, queryConstraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, collectionName), ...queryConstraints);
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
          setData(items);
          setLoading(false);
        },
        (err) => {
          console.error(`Erreur onSnapshot sur ${collectionName}:`, err);
          setError(err);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [collectionName, JSON.stringify(queryConstraints.map(c => c.type))]); // Simplistic dependency array for constraints

  return { data, loading, error };
}
