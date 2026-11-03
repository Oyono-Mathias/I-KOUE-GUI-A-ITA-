import { createContext, createElement, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';

import { type UserRole } from '../constants/roles';
export { INSTITUTIONAL_ROLES, type InstitutionalRole, type LegacyRole, type SystemRole, type UserRole } from '../constants/roles';

export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    role: UserRole;
    photoURL: string | null;
    statut: 'actif' | 'suspendu' | 'a_jour';
}

interface AuthState { user: User | null; userData: UserData | null; loading: boolean; }

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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

    return createElement(AuthContext.Provider, { value: { user, userData, loading } }, children);
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider.');
    return context;
};
