import { ApolloError } from '@apollo/client';
import { toast } from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import { resolveAgentActionScope } from './agentActionScope';

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

type AgentCapability = 'canReadConfig' | 'canEdit' | 'canRemove' | 'canShare';

type AgentAccessTarget = {
  isOwnAgent?: boolean | null;
  capabilities?: Partial<Record<AgentCapability, boolean>> | null;
};


/** Permission checks for agent CRUD. Action scope controls whether a visible
 * agent may be changed or only the caller's own agent may be changed. */
export const useAgentAccess = () => {
  const permissionCheck = usePermissionCheck();
  const { hasActionPermission, isLoaded } = permissionCheck;

  const canShare =
    resolveAgentActionScope(
      permissionCheck,
      ERXES_AGENT_ACTIONS.agent.share,
    ) === 'all';
  const canReadConfig = hasActionPermission(
    ERXES_AGENT_ACTIONS.agent.readConfig,
  );
  const canCreate = hasActionPermission(ERXES_AGENT_ACTIONS.agent.create);
  const canEdit = hasActionPermission(ERXES_AGENT_ACTIONS.agent.update);
  const canRemove = hasActionPermission(ERXES_AGENT_ACTIONS.agent.remove);

  const canUseScopedAction = (action: string, agent: AgentAccessTarget) => {
    const scope = resolveAgentActionScope(permissionCheck, action);
    return scope === 'all' || scope === 'group' || !!agent.isOwnAgent;
  };

  const canUseCapability = (
    agent: AgentAccessTarget,
    capability: AgentCapability,
    action: string,
    hasPermission: boolean,
  ) =>
    agent.capabilities
      ? agent.capabilities[capability] === true
      : hasPermission && canUseScopedAction(action, agent);

  const canReadConfigAgent = (agent: AgentAccessTarget) =>
    canUseCapability(
      agent,
      'canReadConfig',
      ERXES_AGENT_ACTIONS.agent.readConfig,
      canReadConfig,
    );
  const canEditAgent = (agent: AgentAccessTarget) =>
    canUseCapability(
      agent,
      'canEdit',
      ERXES_AGENT_ACTIONS.agent.update,
      canEdit,
    );
  const canRemoveAgent = (agent: AgentAccessTarget) =>
    canUseCapability(
      agent,
      'canRemove',
      ERXES_AGENT_ACTIONS.agent.remove,
      canRemove,
    );
  const canShareAgent = (agent: AgentAccessTarget) =>
    canUseCapability(
      agent,
      'canShare',
      ERXES_AGENT_ACTIONS.agent.share,
      canShare,
    );

  return {
    isLoaded,
    canReadConfig,
    canCreate,
    canEdit,
    canRemove,
    canShare,
    canEditAgent,
    canReadConfigAgent,
    canRemoveAgent,
    canShareAgent,
  };
};
