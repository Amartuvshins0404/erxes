import { gql } from '@apollo/client';

export interface PermissionGroupOption {
  id: string;
  name: string;
  description?: string;
  plugin?: string;
  source: 'default' | 'custom';
}

export interface PermissionGroupsData {
  permissionGroups: Array<{
    _id: string;
    name: string;
    description?: string;
  }>;
  permissionDefaultGroups: Array<{
    id: string;
    name: string;
    description?: string;
    plugin: string;
  }>;
}

export const PERMISSION_GROUPS = gql`
  query MastraPermissionGroups {
    permissionGroups {
      _id
      name
      description
    }
    permissionDefaultGroups {
      id
      name
      description
      plugin
    }
  }
`;

export const permissionGroupOptions = (
  data?: PermissionGroupsData,
): PermissionGroupOption[] => [
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
