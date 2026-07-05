import { gql } from '@apollo/client';

// Core's permission catalog + custom-group CRUD, reached over the federated
// gateway. The Access tab is a self-contained action picker (core-ui's
// PermissionModulesForm lives in a separate module-federation remote and can't
// be imported cross-plugin) driving core's existing, permissionsManage-gated
// group mutations — no core backend change.

/** The full action catalog, grouped plugin -> module -> actions. */
export const PERMISSION_MODULES = gql`
  query PermissionModules {
    permissionModules {
      plugin
      modules {
        name
        description
        actions {
          name
          title
          description
          always
          disabled
        }
      }
    }
  }
`;

/** A single group's current permissions — used to preselect the picker. */
export const PERMISSION_GROUP_DETAIL = gql`
  query PermissionGroupDetail($id: String!) {
    permissionGroupDetail(id: $id) {
      _id
      name
      permissions {
        plugin
        module
        actions
        scope
      }
    }
  }
`;

/**
 * All custom groups (id + name) — used to ADOPT an existing
 * `agent-grant:<agentId>` group when the agent lost its grantGroupId, so a
 * retried save edits the same group instead of proliferating duplicates.
 */
export const PERMISSION_GROUPS = gql`
  query PermissionGroups {
    permissionGroups {
      _id
      name
    }
  }
`;

export const PERMISSION_GROUP_ADD = gql`
  mutation PermissionGroupAdd(
    $name: String!
    $description: String
    $permissions: [PermissionInput]!
  ) {
    permissionGroupAdd(
      name: $name
      description: $description
      permissions: $permissions
    ) {
      _id
    }
  }
`;

export const PERMISSION_GROUP_EDIT = gql`
  mutation PermissionGroupEdit(
    $_id: String!
    $name: String
    $permissions: [PermissionInput]
  ) {
    permissionGroupEdit(_id: $_id, name: $name, permissions: $permissions) {
      _id
    }
  }
`;
