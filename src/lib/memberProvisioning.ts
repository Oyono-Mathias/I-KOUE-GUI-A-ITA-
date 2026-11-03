import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export interface CreateMemberInput {
  nom: string;
  email: string;
  password: string;
  telephone?: string;
  categorie?: 'actif' | 'bienfaiteur' | 'fondateur';
}

interface CreateMemberResult {
  uid: string;
  role: 'membre';
}

const createUserCallable = httpsCallable<CreateMemberInput, CreateMemberResult>(
  functions,
  'createUser',
);

export const createMemberAccount = async (input: CreateMemberInput): Promise<CreateMemberResult> => {
  const result = await createUserCallable(input);
  return result.data;
};
