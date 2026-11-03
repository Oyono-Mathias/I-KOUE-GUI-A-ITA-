import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { LandingContent } from '../types/landing';

const landingContentRef = doc(db, 'landing_content', 'main');

export const subscribeLandingContent = (
  onContent: (content: Partial<LandingContent> | null) => void,
  onError?: (error: Error) => void,
) => onSnapshot(
  landingContentRef,
  (snapshot) => onContent(snapshot.exists() ? snapshot.data() as LandingContent : null),
  (error) => onError?.(error),
);

export const saveLandingContent = async (
  content: Omit<LandingContent, 'updatedAt' | 'updatedBy'>,
  uid: string,
) => {
  await setDoc(landingContentRef, { ...content, updatedAt: serverTimestamp(), updatedBy: uid });
};
