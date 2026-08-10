export type AgentActionScope = 'own' | 'group' | 'all';

type AgentPermissionScope = {
  plugin: string;
  module: string;
  actions: readonly string[];
  scope?: AgentActionScope | null;
  actionScopes?: Partial<Record<string, AgentActionScope>> | null;
};

export type AgentActionScopeProvider = {
  isWildcard: boolean;
  permissions?: readonly AgentPermissionScope[] | null;
  getActionScope?: (
    actionName: string,
    pluginName?: string,
  ) => AgentActionScope | null;
};

/** Supports both current hosts and pre-action-scope Module Federation hosts. */
export const resolveAgentActionScope = (
  permissionCheck: AgentActionScopeProvider,
  actionName: string,
) => {
  if (permissionCheck.getActionScope) {
    return permissionCheck.getActionScope(actionName);
  }

  if (permissionCheck.isWildcard) {
    return 'all';
  }

  const permission = permissionCheck.permissions?.find((candidate) =>
    candidate.actions.includes(actionName),
  );

  return (
    permission?.actionScopes?.[actionName] ?? permission?.scope ?? null
  );
};
