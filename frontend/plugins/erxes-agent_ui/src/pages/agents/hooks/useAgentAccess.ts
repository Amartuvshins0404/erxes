import { ApolloError } from '@apollo/client';
import { toast } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';

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
  const { hasActionPermission, isLoaded } = usePermissionCheck();

  const isAdmin = hasActionPermission('settingsManage');
  const canCreate = hasActionPermission('agentsCreate');
  const canEdit = hasActionPermission('agentsEdit');
  const canRemove = hasActionPermission('agentsRemove');

  const canEditAgent = (_agent?: object) => canEdit;
  const canRemoveAgent = (_agent?: object) => canRemove;

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
