import { useAtomValue } from 'jotai';
import { currentUserState, IUser } from 'ui-modules';
import { useGetMemberProfile } from './useGetMemberProfile';

/**
 * Whether the signed-in user may manage this agency's members. Agency roles are
 * separate from erxes permission groups, and the tenant owner always counts as
 * an agency admin — the API enforces the same rule.
 */
export const useIsAgencyAdmin = () => {
  const currentUser = useAtomValue(currentUserState) as IUser | null;
  const { profile, loading } = useGetMemberProfile();

  return {
    isAgencyAdmin: !!currentUser?.isOwner || profile?.role === 'admin',
    loading,
  };
};
