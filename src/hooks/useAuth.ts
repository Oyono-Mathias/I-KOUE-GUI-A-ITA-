import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { INSTITUTIONAL_ROLES, type InstitutionalRole } from '../constants/roles';

export { INSTITUTIONAL_ROLES } from '../constants/roles';
export type { InstitutionalRole } from '../constants/roles';


export type LegacyRole = 'secretaire' | 'admin_bureau';
export type SystemRole = 'super_admin' | 'admin';
export type UserRole = InstitutionalRole | LegacyRole | SystemRole;

export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: UserRole;
    photoURL: string | null;
    statut: 'actif' | 'suspendu' | 'a_jour';
}

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserDoc: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            // Toujours fermer l'écoute précédente avant de changer d'identité.
            unsubscribeUserDoc?.();
            unsubscribeUserDoc = undefined;
            setUser(firebaseUser);
            setUserData(null);
            setLoading(true);

            if (!firebaseUser) {
                setLoading(false);
                return;
            }

            unsubscribeUserDoc = onSnapshot(
                doc(db, 'users', firebaseUser.uid),
                (docSnap) => {
                    if (auth.currentUser?.uid !== firebaseUser.uid) return;

                    if (docSnap.exists()) {
                        setUserData({ uid: firebaseUser.uid, ...docSnap.data() } as UserData);
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                },
                (error) => {
                    if (auth.currentUser?.uid !== firebaseUser.uid) return;
                    console.error('Erreur de lecture du rôle:', error);
                    setUserData(null);
                    setLoading(false);
                }
            );
        });

        return () => {
            unsubscribeUserDoc?.();
            unsubscribeAuth();
        };
    }, []);

    return { user, userData, loading };
};
