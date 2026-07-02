import { ApolloError } from '@apollo/client';
import { toast } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';

type SkillAction =
  | 'create'
  | 'edit'
  | 'delete'
  | 'publish'
  | 'promote'
  | 'demote'
  | 'activate';

/** Red toaster shown when a user attempts a skill action they can't perform. */
export const showSkillPermissionError = (action: SkillAction) =>
  toast({
    title: 'Permission denied',
    description: `You don't have permission to ${action} skills.`,
    variant: 'destructive',
  });

const isPermissionError = (e: ApolloError) =>
  e.graphQLErrors?.some((g) => g.extensions?.code === 'FORBIDDEN') ||
  /permission/i.test(e.message);

/** Apollo `onError`: permission denials get the friendly toast, everything else
 *  (validation, duplicate name, …) falls back to the raw ExpectedError message. */
export const skillMutationError = (action: SkillAction) => (e: ApolloError) =>
  isPermissionError(e)
    ? showSkillPermissionError(action)
    : toast({ title: 'Error', description: e.message, variant: 'destructive' });

/**
 * Frontend gate mirroring the backend skills permission module. `skillsView`
 * is held by every logged-in user; create/edit/remove by admin + user groups;
 * `skillsPromote` is admin-only. Ownership (isMine) is enforced separately in
 * resolvers — these flags only gate the affordances.
 */
export const useSkillAccess = () => {
  const { hasActionPermission } = usePermissionCheck();
  return {
    canCreate: hasActionPermission('skillsCreate'),
    canEdit: hasActionPermission('skillsEdit'),
    canRemove: hasActionPermission('skillsRemove'),
    canPromote: hasActionPermission('skillsPromote'),
  };
};
