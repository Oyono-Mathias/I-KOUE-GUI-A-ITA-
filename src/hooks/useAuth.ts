import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: 'super_admin' | 'president_fondateur' | 'president' | 'vice_president' | 'admin_bureau' | 'secretaire' | 'tresorier' | 'communicateur' | 'conseiller' | 'admin' | 'membre' | 'member';
    photoURL: string | null;
    statut: 'en_attente' | 'actif' | 'suspendu' | 'radie' | 'a_jour';
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeDoc: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // Nettoie l'écoute du profil précédent lors d'un changement de compte.
            unsubscribeDoc?.();
            unsubscribeDoc = undefined;
            setUser(firebaseUser);
            setUserData(null);
            setLoading(true);

            if (!firebaseUser) {
                setLoading(false);
                return;
            }

            // Écoute en temps réel du document utilisateur dans Firestore.
            unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
                if (docSnap.exists()) {
                    setUserData({ uid: firebaseUser.uid, ...docSnap.data() } as UserData);
                } else {
                    setUserData(null);
                }
                setLoading(false);
            }, (error) => {
                console.error("Erreur de lecture du rôle:", error);
                setUserData(null);
                setLoading(false);
            });
        });

        return () => {
            unsubscribeAuth();
            unsubscribeDoc?.();
        };
    }, []);

    return { user, userData, loading };
};
