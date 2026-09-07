export interface SiteConfig {
  id?: string;
  history: string;
  objectives: string[];
  values: string[];
  address: string;
  phone1: string;
  phone2: string;
  email: string;
  facebookUrl: string;
}

export interface NewsItem {
  id?: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  date: any; // Firestore Timestamp
  category: string;
}

export interface DomainItem {
  id?: string;
  title: string;
  description: string;
  iconName: string;
  order: number;
}

export interface PublicReport {
  id?: string;
  title: string;
  type: 'activite' | 'finance_simplifie';
  description: string;
  fileUrl: string;
  date: any; // Firestore Timestamp
}

export interface ContactMessage {
  id?: string;
  nom: string;
  email: string;
  tel: string;
  sujet: string;
  message: string;
  createdAt: any;
  status: 'nouveau' | 'lu' | 'traite';
}

export interface MembershipRequest {
  id?: string;
  nom: string;
  email: string;
  tel: string;
  motivation: string;
  statut: 'en_attente' | 'accepte' | 'refuse';
  createdAt: any;
}
