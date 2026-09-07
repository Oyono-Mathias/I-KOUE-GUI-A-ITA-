import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { userData, loading } = useAuth();

  // Si non connecté ou pas de données, tout est à false
  if (!userData || loading) {
    return {
      role: 'visiteur',
      isUpToDate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canViewFinances: false,
      hasVotingRight: false,
      loading
    };
  }

  const role = userData.role;
  const isUpToDate = userData.statut === 'actif' || userData.statut === 'a_jour';

  // Matrices d'autorisation basées sur la demande
  const canEdit = ['president', 'secretaire', 'admin', 'super_admin', 'admin_bureau', 'president_fondateur'].includes(role);
  const canDelete = ['president', 'admin', 'super_admin', 'president_fondateur'].includes(role);
  const canApprove = ['president', 'secretaire', 'admin', 'super_admin', 'admin_bureau', 'president_fondateur'].includes(role);
  const canViewFinances = ['president', 'tresorier', 'president_fondateur', 'admin', 'super_admin'].includes(role);
  
  // Droit de vote = Être à jour de cotisation (actif) + avoir un rôle officiel ou membre
  const hasVotingRight = isUpToDate && role !== 'visiteur';

  return {
    role,
    isUpToDate,
    canEdit,
    canDelete,
    canApprove,
    canViewFinances,
    hasVotingRight,
    loading
  };
};
