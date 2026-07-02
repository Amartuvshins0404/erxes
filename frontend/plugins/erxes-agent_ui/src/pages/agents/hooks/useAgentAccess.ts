import { ApolloError } from '@apollo/client';
import { toast } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';

const PERMISSION_DENIED = {
  title: 'Permission denied',
  description: 'You do not have permission to perform this action.',
} as const;

const QUOTA_REACHED = {
  title: 'Agent limit reached',
  description: 'You have reached your agent creation limit.',
} as const;

export const showAgentPermissionError = () =>
  toast({ ...PERMISSION_DENIED, variant: 'destructive' });

export const showAgentQuotaError = () =>
  toast({ ...QUOTA_REACHED, variant: 'destructive' });

const isPermissionError = (e: ApolloError) =>
  e.graphQLErrors?.some((g) => g.extensions?.code === 'FORBIDDEN') ||
  /permission|access denied/i.test(e.message);

const isQuotaError = (e: ApolloError) => /quota/i.test(e.message);

/** Apollo `onError` handler — maps all backend access/quota errors to the same
 *  friendly toasts so every user account sees identical messages. */
export const agentMutationError = () => (e: ApolloError) => {
  if (isPermissionError(e)) return showAgentPermissionError();
  if (isQuotaError(e)) return showAgentQuotaError();
  toast({ title: 'Error', description: e.message, variant: 'destructive' });
};

/** Permission checks for agent CRUD. canEditAgent / canRemoveAgent are
 *  per-row: admins may touch any agent; regular users only their own. */
export const useAgentAccess = () => {
  const { hasActionPermission, isLoaded } = usePermissionCheck();

  const isAdmin = hasActionPermission('settingsManage');
  const canCreate = hasActionPermission('agentsCreate');
  const canEdit = hasActionPermission('agentsEdit');
  const canRemove = hasActionPermission('agentsRemove');

  /** Backend sets isOwnAgent per-row so the check is always accurate. */
  const canEditAgent = (agent: { isOwnAgent?: boolean | null }) =>
    isAdmin || (canEdit && !!agent.isOwnAgent);

  const canRemoveAgent = (agent: { isOwnAgent?: boolean | null }) =>
    isAdmin || (canRemove && !!agent.isOwnAgent);

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
