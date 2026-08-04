import { gql } from '@apollo/client';

export interface PermissionGroupOption {
  id: string;
  name: string;
  description?: string;
  plugin?: string;
  source: 'default' | 'custom';
}

export interface PermissionGroupsData {
  currentUser?: {
    permissionGroupIds?: string[];
  };
  permissionGroups?: Array<{
    _id: string;
    name: string;
    description?: string;
  }>;
  permissionDefaultGroups?: Array<{
    id: string;
    name: string;
    description?: string;
    plugin: string;
  }>;
}

export interface PermissionGroupsVariables {
  includeCustomGroups: boolean;
  includeDefaultGroups: boolean;
}
export interface AudienceTeamOption {
  _id: string;
  name: string;
  description?: string;
}

export interface AudienceTeamsData {
  getTeams?: AudienceTeamOption[];
}

export const PERMISSION_GROUPS = gql`
  query MastraPermissionGroups(
    $includeCustomGroups: Boolean!
    $includeDefaultGroups: Boolean!
  ) {
    currentUser {
      permissionGroupIds
    }
    permissionGroups @include(if: $includeCustomGroups) {
      _id
      name
      description
    }
    permissionDefaultGroups @include(if: $includeDefaultGroups) {
      id
      name
      description
      plugin
    }
  }
`;
export const AUDIENCE_TEAMS = gql`
  query MastraAudienceTeams {
    getTeams {
      _id
      name
      description
    }
  }
`;

type HasActionPermission = (actionName: string, pluginName?: string) => boolean;

export const permissionGroupQueryVariables = (
  hasActionPermission: HasActionPermission,
): PermissionGroupsVariables => {
  const canReadAllGroups =
    hasActionPermission('permissionsRead', 'core') ||
    hasActionPermission('permissionsManage', 'core');

  return {
    includeCustomGroups:
      canReadAllGroups ||
      hasActionPermission('permissionsAgentProfilesManage', 'core'),
    includeDefaultGroups: canReadAllGroups,
  };
};

export const permissionGroupOptions = (
  data: PermissionGroupsData | undefined,
  canAssignAnyGroup: boolean,
): PermissionGroupOption[] => {
  const catalogOptions: PermissionGroupOption[] = [
    ...(data?.permissionDefaultGroups ?? []).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      plugin: group.plugin,
      source: 'default' as const,
    })),
    ...(data?.permissionGroups ?? []).map((group) => ({
      id: group._id,
      name: group.name,
      description: group.description,
      source: 'custom' as const,
    })),
  ];
  const optionsById = new Map(catalogOptions.map((group) => [group.id, group]));
  const assignedGroupIds = data?.currentUser?.permissionGroupIds ?? [];
  const assignedOptions: PermissionGroupOption[] = [];

  for (const id of assignedGroupIds) {
    const catalogOption = optionsById.get(id);
    if (catalogOption) {
      assignedOptions.push(catalogOption);
      continue;
    }

    const separatorIndex = id.indexOf(':');
    const isDefault = separatorIndex > 0;
    const fallbackOption: PermissionGroupOption = {
      id,
      name: id,
      plugin: isDefault ? id.slice(0, separatorIndex) : undefined,
      source: isDefault ? 'default' : 'custom',
    };
    optionsById.set(id, fallbackOption);
    assignedOptions.push(fallbackOption);
  }

  return canAssignAnyGroup ? [...optionsById.values()] : assignedOptions;
};
