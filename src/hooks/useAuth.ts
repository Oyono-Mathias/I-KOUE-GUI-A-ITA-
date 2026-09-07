import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: 'super_admin' | 'president_fondateur' | 'president' | 'vice_president' | 'admin_bureau' | 'secretaire' | 'tresorier' | 'communicateur' | 'conseiller' | 'admin' | 'membre';
    photoURL: string | null;
    statut: 'actif' | 'suspendu' | 'a_jour';
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Écoute en temps réel du document utilisateur dans Firestore
                const unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        setUserData({ uid: firebaseUser.uid, ...docSnap.data() } as UserData);
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Erreur de lecture du rôle:", error);
                    setLoading(false);
                });
                
                return () => unsubscribeDoc();
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    return { user, userData, loading };
};
