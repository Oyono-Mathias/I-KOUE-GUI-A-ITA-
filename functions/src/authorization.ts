const ALLOWED_CREATOR_ROLES = new Set([
  'president',
  'president_fondateur',
  'secretaire_general',
  'secretaire',
  'super_admin',
]);

export const canCreateMember = (role: unknown, status: unknown): boolean =>
  typeof role === 'string' && ALLOWED_CREATOR_ROLES.has(role) && status !== 'suspendu';
