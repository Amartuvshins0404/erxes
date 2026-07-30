import { ApolloError } from '@apollo/client';
import { toast } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';

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

/** Frontend affordances mirror the discrete backend skill actions. Ownership
 * checks remain at each row/form because permissions alone never disclose a
 * different user's private skill. */
export const useSkillAccess = () => {
  const { hasActionPermission } = usePermissionCheck();
  return {
    canCreate: hasActionPermission(ERXES_AGENT_ACTIONS.skills.create),
    canEdit: hasActionPermission(ERXES_AGENT_ACTIONS.skills.update),
    canPublish: hasActionPermission(ERXES_AGENT_ACTIONS.skills.publish),
    canRemove: hasActionPermission(ERXES_AGENT_ACTIONS.skills.remove),
    canPromote: hasActionPermission(ERXES_AGENT_ACTIONS.skills.promote),
    canModerate: hasActionPermission(ERXES_AGENT_ACTIONS.skills.moderate),
    canActivate:
      hasActionPermission(ERXES_AGENT_ACTIONS.skills.read) &&
      hasActionPermission(ERXES_AGENT_ACTIONS.agent.chat),
  };
};
