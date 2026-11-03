export interface LandingContent {
  hero: { title: string; subtitle: string; bannerUrl: string; primaryCtaLabel: string; primaryCtaUrl: string; secondaryCtaLabel: string; secondaryCtaUrl: string };
  statistics: Array<{ label: string; value: string }>;
  about: { history: string; mission: string };
  donation: { title: string; description: string; mobileMoney: { orangeMoneyNumber: string; moovMoneyNumber: string; airtelMoneyNumber: string; orangeMoneyLink: string; moovMoneyLink: string; airtelMoneyLink: string } };
  banners: string[];
  contact: { address: string; phone1: string; phone2: string; email: string; facebookUrl: string };
  updatedAt?: unknown;
  updatedBy?: string;
}

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    title: 'Agir pour la Solidarité et le Développement en RCA',
    subtitle: "Promouvoir l'autonomisation des femmes, l'agriculture durable et l'accès à l'éducation pour les populations vulnérables.",
    bannerUrl: '', primaryCtaLabel: 'FAIRE UN DON', primaryCtaUrl: '#don',
    secondaryCtaLabel: 'NOS DOMAINES', secondaryCtaUrl: '#domaines',
  },
  statistics: [
    { label: 'Bénéficiaires', value: '500+' },
    { label: "Domaines d'action", value: '6' },
    { label: 'Arrondissement', value: '8ème' },
    { label: 'Transparence', value: '100%' },
  ],
  about: {
    history: "L'Association I KOUE GUI A ITA est une association apolitique, non confessionnelle et sans but lucratif, reconnue d'utilité publique conformément à la Loi N° 61/233 du 27 Mai 1961.",
    mission: "Promouvoir la solidarité, l'autonomisation de la femme, le droit de l'enfant, l'environnement, l'agriculture, l'élevage, l'entraide sociale et le développement durable.",
  },
  donation: {
    title: 'Soutenez Nos Actions',
    description: 'Chaque don, même modeste, fait la différence. Donnez via Mobile Money.',
    mobileMoney: {
      orangeMoneyNumber: '+236 75 03 08 57', moovMoneyNumber: '+236 72 06 12 02', airtelMoneyNumber: '+236 75 03 08 57',
      orangeMoneyLink: '', moovMoneyLink: '', airtelMoneyLink: '',
    },
  },
  banners: [],
  contact: {
    address: 'Galabadja II, 8ème Arrondissement, Bangui, RCA',
    phone1: '+236 75 03 08 57', phone2: '+236 72 06 12 02',
    email: 'associationikoueguiaita@gmail.com', facebookUrl: 'Association I KOUE GUI A ITA',
  },
};
