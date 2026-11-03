export interface LandingContent {
  hero: {
    title: string;
    subtitle: string;
    bannerUrl: string;
    primaryCtaLabel: string;
    primaryCtaUrl: string;
    secondaryCtaLabel: string;
    secondaryCtaUrl: string;
  };
  statistics: Array<{ label: string; value: string }>;
  about: { history: string; mission: string };
  donation: {
    title: string;
    description: string;
    mobileMoney: {
      orangeMoneyNumber: string;
      moovMoneyNumber: string;
      airtelMoneyNumber: string;
      orangeMoneyLink: string;
      moovMoneyLink: string;
      airtelMoneyLink: string;
    };
  };
  banners: string[];
  contact: { address: string; phone1: string; phone2: string; email: string; facebookUrl: string };
  updatedAt?: unknown;
  updatedBy?: string;
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    title: 'Agir pour la Solidarité et le Développement en RCA',
    subtitle: "Promouvoir l'autonomisation des femmes, l'agriculture durable et l'accès à l'éducation pour les populations vulnérables.",
    bannerUrl: '',
    primaryCtaLabel: 'FAIRE UN DON',
    primaryCtaUrl: '#don',
    secondaryCtaLabel: 'NOS DOMAINES',
    secondaryCtaUrl: '#domaines',
  },
  statistics: [
    { label: 'Bénéficiaires', value: '500+' },
    { label: "Domaines d'action", value: '6' },
    { label: 'Arrondissement', value: '8ème' },
    { label: 'Transparence', value: '100%' },
  ],
  about: { history: '', mission: '' },
  donation: {
    title: 'Soutenez Nos Actions',
    description: 'Chaque don, même modeste, fait la différence. Donnez via Mobile Money.',
    mobileMoney: {
      orangeMoneyNumber: '', moovMoneyNumber: '', airtelMoneyNumber: '',
      orangeMoneyLink: '', moovMoneyLink: '', airtelMoneyLink: '',
    },
  },
  banners: [],
  contact: { address: '', phone1: '', phone2: '', email: '', facebookUrl: '' },
};
