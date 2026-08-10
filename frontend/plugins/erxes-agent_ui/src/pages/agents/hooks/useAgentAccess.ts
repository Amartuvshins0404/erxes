import { ApolloError } from '@apollo/client';
import { useAtomValue } from 'jotai';
import { toast } from 'erxes-ui';
import { currentUserState, usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import { resolveAgentActionScope } from './agentActionScope';

const PERMISSION_DENIED = {
  title: 'Permission denied',
  description: 'You do not have permission to perform this action.',
} as const;

export const showAgentPermissionError = () =>
  toast({ ...PERMISSION_DENIED, variant: 'destructive' });

const isPermissionError = (e: ApolloError) =>
  e.graphQLErrors?.some((g) => g.extensions?.code === 'FORBIDDEN') ||
  /permission|access denied/i.test(e.message);

/** Apollo error handler shared by every agent mutation. */
export const agentMutationError = () => (error: ApolloError) => {
  if (isPermissionError(error)) return showAgentPermissionError();
  toast({ title: 'Error', description: error.message, variant: 'destructive' });
};

/** CRUD permissions mirror the core permission actions enforced by GraphQL. */
export const useAgentAccess = () => {
  const permissionCheck = usePermissionCheck();
  const { hasActionPermission, isLoaded } = permissionCheck;
  const currentUserId = useAtomValue(currentUserState)?._id;

  const isAdmin = hasActionPermission(ERXES_AGENT_ACTIONS.settings.manage);
  const createScope = resolveAgentActionScope(
    permissionCheck,
    ERXES_AGENT_ACTIONS.agent.create,
  );
  const updateScope = resolveAgentActionScope(
    permissionCheck,
    ERXES_AGENT_ACTIONS.agent.update,
  );
  const removeScope = resolveAgentActionScope(
    permissionCheck,
    ERXES_AGENT_ACTIONS.agent.remove,
  );
  const canCreate = createScope !== null;
  const canEdit = updateScope !== null;
  const canRemove = removeScope !== null;

  const isInScope = (
    scope: 'own' | 'group' | 'all' | null,
    agent?: { createdBy?: string | null },
  ) =>
    scope === 'all' ||
    scope === 'group' ||
    (scope === 'own' && agent?.createdBy === currentUserId);
  const canEditAgent = (agent?: { createdBy?: string | null }) =>
    canEdit && isInScope(updateScope, agent);
  const canRemoveAgent = (agent?: { createdBy?: string | null }) =>
    canRemove && isInScope(removeScope, agent);

  return {
    isLoaded,
    canCreate,
    canEdit,
    canRemove,
    isAdmin,
    canEditAgent,
    canRemoveAgent,
  };
};
