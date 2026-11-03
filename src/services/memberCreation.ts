import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

interface CreateMemberInput {
  nom: string;
  email: string;
  password: string;
  telephone?: string;
  categorie: 'actif' | 'bienfaiteur' | 'fondateur';
}

export const createOrdinaryMember = async (input: CreateMemberInput) => {
  const callable = httpsCallable<CreateMemberInput, { uid: string }>(
    getFunctions(app),
    'createOrdinaryMember',
  );
  return callable({ ...input, nom: input.nom.trim(), email: input.email.trim().toLowerCase() });
};
