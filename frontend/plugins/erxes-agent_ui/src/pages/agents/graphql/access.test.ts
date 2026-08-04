import { buildSchema, execute } from 'graphql';
import {
  PERMISSION_GROUPS,
  permissionGroupOptions,
  permissionGroupQueryVariables,
  type PermissionGroupsData,
} from './access';

describe('agent permission group access', () => {
  it('omits protected permission catalogs for ordinary agent creators', () => {
    const hasActionPermission = jest.fn(() => false);

    expect(permissionGroupQueryVariables(hasActionPermission)).toEqual({
      includeCustomGroups: false,
      includeDefaultGroups: false,
    });
  });

  it('returns current user groups without invoking protected resolvers', async () => {
    const schema = buildSchema(`
      type CurrentUser {
        permissionGroupIds: [String!]
      }

      type PermissionGroup {
        _id: String!
        name: String!
        description: String
      }

      type PermissionDefaultGroup {
        id: String!
        name: String!
        description: String
        plugin: String!
      }

      type Query {
        currentUser: CurrentUser
        permissionGroups: [PermissionGroup!]
        permissionDefaultGroups: [PermissionDefaultGroup!]
      }
    `);
    const permissionGroups = jest.fn(() => []);
    const permissionDefaultGroups = jest.fn(() => []);
    const result = await execute({
      schema,
      document: PERMISSION_GROUPS,
      rootValue: {
        currentUser: () => ({
          permissionGroupIds: ['sales:user'],
        }),
        permissionGroups,
        permissionDefaultGroups,
      },
      variableValues: {
        includeCustomGroups: false,
        includeDefaultGroups: false,
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({
      currentUser: {
        permissionGroupIds: ['sales:user'],
      },
    });
    expect(permissionGroups).not.toHaveBeenCalled();
    expect(permissionDefaultGroups).not.toHaveBeenCalled();
  });

  it('loads only agent profiles for profile managers', () => {
    const hasActionPermission = jest.fn(
      (actionName: string, pluginName?: string) =>
        pluginName === 'core' &&
        actionName === 'permissionsAgentProfilesManage',
    );

    expect(permissionGroupQueryVariables(hasActionPermission)).toEqual({
      includeCustomGroups: true,
      includeDefaultGroups: false,
    });
  });

  it('loads both permission catalogs for full permission readers', () => {
    const hasActionPermission = jest.fn(
      (actionName: string, pluginName?: string) =>
        pluginName === 'core' && actionName === 'permissionsRead',
    );

    expect(permissionGroupQueryVariables(hasActionPermission)).toEqual({
      includeCustomGroups: true,
      includeDefaultGroups: true,
    });
  });

  it('keeps ordinary creators within their assigned permission groups', () => {
    const data: PermissionGroupsData = {
      currentUser: {
        permissionGroupIds: ['sales:user', 'custom-1'],
      },
      permissionDefaultGroups: [
        {
          id: 'sales:user',
          name: 'Sales User',
          plugin: 'sales',
        },
        {
          id: 'accounting:admin',
          name: 'Accounting Admin',
          plugin: 'accounting',
        },
      ],
      permissionGroups: [
        { _id: 'custom-1', name: 'Sales Operators' },
        { _id: 'custom-2', name: 'Finance Operators' },
      ],
    };

    expect(permissionGroupOptions(data, false)).toEqual([
      expect.objectContaining({ id: 'sales:user', name: 'Sales User' }),
      expect.objectContaining({ id: 'custom-1', name: 'Sales Operators' }),
    ]);
  });

  it('uses safe labels when protected catalogs are unavailable', () => {
    const data: PermissionGroupsData = {
      currentUser: {
        permissionGroupIds: ['sales:user', 'custom-1'],
      },
    };

    expect(permissionGroupOptions(data, false)).toEqual([
      {
        id: 'sales:user',
        name: 'sales:user',
        plugin: 'sales',
        source: 'default',
      },
      {
        id: 'custom-1',
        name: 'custom-1',
        source: 'custom',
      },
    ]);
  });
});
