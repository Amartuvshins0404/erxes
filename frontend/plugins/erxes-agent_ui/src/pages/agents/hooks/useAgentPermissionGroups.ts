import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { usePermissionCheck } from 'ui-modules';
import { ERXES_AGENT_ACTIONS } from '~/permissions';
import {
  PERMISSION_GROUPS,
  permissionGroupOptions,
  permissionGroupQueryVariables,
  type PermissionGroupsData,
  type PermissionGroupsVariables,
} from '../graphql/access';
import { resolveAgentActionScope } from './agentActionScope';

export const useAgentPermissionGroups = () => {
  const permissionCheck = usePermissionCheck();
  const canAssignAnyGroup =
    resolveAgentActionScope(
      permissionCheck,
      ERXES_AGENT_ACTIONS.agent.create,
    ) === 'all' ||
    resolveAgentActionScope(
      permissionCheck,
      ERXES_AGENT_ACTIONS.agent.update,
    ) === 'all';
  const variables = permissionGroupQueryVariables(
    permissionCheck.hasActionPermission,
  );
  const { data, loading, error } = useQuery<
    PermissionGroupsData,
    PermissionGroupsVariables
  >(PERMISSION_GROUPS, {
    skip: !permissionCheck.isLoaded,
    variables,
  });
  const groups = useMemo(
    () => permissionGroupOptions(data, canAssignAnyGroup),
    [canAssignAnyGroup, data],
  );

  return {
    groups,
    loading: !permissionCheck.isLoaded || loading,
    error,
  };
};
