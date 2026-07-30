import {
  IPermissionGroupPermission,
  PermissionScope,
  IPermissionAction,
  IPermissionModule,
  IDefaultPermissionGroup,
  ICustomPermission,
} from 'erxes-api-shared/core-types';
import { getPlugins, getPlugin } from 'erxes-api-shared/utils';
import { canGroup } from 'erxes-api-shared/core-modules';
import { IContext } from '~/connectionResolvers';
import { isAgentCallablePermissionAction } from '~/modules/permissions/agentProfiles';

export interface IEffectivePermission extends IPermissionGroupPermission {
  actionScopes: Record<string, PermissionScope>;
}

const SCOPE_PRIORITY: Record<PermissionScope, number> = {
  own: 1,
  group: 2,
  all: 3,
};

export const mergePermission = (
  map: Map<string, IEffectivePermission>,
  permission: IPermissionGroupPermission | ICustomPermission,
  sourcePlugin?: string,
) => {
  const plugin = permission.plugin || sourcePlugin || '';
  const key = `${plugin}:${permission.module}`;
  const existing = map.get(key);

  if (!existing) {
    map.set(key, {
      plugin,
      module: permission.module,
      actions: [...permission.actions],
      scope: permission.scope,
      actionScopes: Object.fromEntries(
        permission.actions.map((actionName) => [actionName, permission.scope]),
      ),
    });
    return;
  }

  existing.actions = [...new Set([...existing.actions, ...permission.actions])];

  if (SCOPE_PRIORITY[permission.scope] > SCOPE_PRIORITY[existing.scope]) {
    existing.scope = permission.scope;
  }

  for (const actionName of permission.actions) {
    const currentScope = existing.actionScopes[actionName];

    if (
      !currentScope ||
      SCOPE_PRIORITY[permission.scope] > SCOPE_PRIORITY[currentScope]
    ) {
      existing.actionScopes[actionName] = permission.scope;
    }
  }
};

const getPermissionReadMode = async (
  context: IContext,
): Promise<'all' | 'agent'> => {
  if (!context.user) throw new Error('Login required');
  if (
    (await canGroup(context.subdomain, 'permissionsRead', context.user)) ||
    (await canGroup(context.subdomain, 'permissionsManage', context.user))
  ) {
    return 'all';
  }
  if (
    await canGroup(
      context.subdomain,
      'permissionsAgentProfilesManage',
      context.user,
    )
  ) {
    return 'agent';
  }
  throw new Error('Permission required');
};

export const permissionQueries = {
  async permissionModules(_root: unknown, _args: unknown, context: IContext) {
    await getPermissionReadMode(context);
    const grouped: { plugin: string; modules: IPermissionModule[] }[] = [];
    const services = await getPlugins();

    for (const name of services) {
      const service = await getPlugin(name);
      const permissions = service?.config?.meta?.permissions;
      if (!permissions?.modules) continue;

      const modules = permissions.modules
        .map((module: IPermissionModule) => ({
          ...module,
          plugin: name,
          actions: (module.actions ?? []).map(
            (permissionAction: IPermissionAction) => ({
              ...permissionAction,
              agentCallable: isAgentCallablePermissionAction(
                module,
                permissionAction,
              ),
            }),
          ),
        }))
        .sort((a: IPermissionModule, b: IPermissionModule) =>
          a.name.localeCompare(b.name),
        );

      grouped.push({ plugin: name, modules });
    }

    return grouped.sort((a, b) => a.plugin.localeCompare(b.plugin));
  },

  async permissionDefaultGroups(
    _root: unknown,
    _args: unknown,
    context: IContext,
  ) {
    if ((await getPermissionReadMode(context)) !== 'all') {
      throw new Error('Permission required');
    }
    const groups: Array<{ plugin: string; [key: string]: unknown }> = [];
    const services = await getPlugins();

    for (const name of services) {
      const service = await getPlugin(name);
      const permissions = service?.config?.meta?.permissions;
      if (!permissions?.defaultGroups) continue;

      for (const group of permissions.defaultGroups) {
        groups.push({ ...group, plugin: name });
      }
    }

    return groups;
  },

  async permissionGroups(_root: unknown, _args: unknown, context: IContext) {
    const mode = await getPermissionReadMode(context);
    const filter = mode === 'agent' ? { principalType: 'agent' } : {};
    return context.models.PermissionGroups.find(filter).sort({ name: 1 });
  },

  async permissionGroupDetail(
    _root: unknown,
    { id }: { id: string },
    context: IContext,
  ) {
    const mode = await getPermissionReadMode(context);
    const filter =
      mode === 'agent' ? { _id: id, principalType: 'agent' } : { _id: id };
    return context.models.PermissionGroups.findOne(filter);
  },

  async currentUserPermissions(
    _root: unknown,
    _args: unknown,
    { user, models }: IContext,
  ) {
    if (!user) throw new Error('Login required');

    const plugins = await getPlugins();

    const pluginsWithPermissions: string[] = [];
    const allDefaultGroups: IDefaultPermissionGroup[] = [];

    for (const pluginName of plugins) {
      const plugin = await getPlugin(pluginName);
      const permissions = plugin?.config?.meta?.permissions;

      if (permissions?.modules?.length || permissions?.defaultGroups?.length) {
        pluginsWithPermissions.push(pluginName);
      }

      if (permissions?.defaultGroups) {
        allDefaultGroups.push(...permissions.defaultGroups);
      }
    }

    if (user.isOwner) {
      return {
        permissions: [
          { plugin: '*', module: '*', actions: ['*'], scope: 'all' },
        ],
        pluginsWithPermissions,
      };
    }

    const groupIds = user.permissionGroupIds || [];
    const customPermissions = user.customPermissions || [];

    const permMap = new Map<string, IEffectivePermission>();

    for (const groupId of groupIds) {
      if (groupId.includes(':')) {
        const group = allDefaultGroups.find((g) => g.id === groupId);
        if (group) {
          for (const perm of group.permissions) {
            mergePermission(permMap, perm);
          }
        }
      } else {
        const group = await models.PermissionGroups.findOne({ _id: groupId });

        if (group) {
          for (const perm of group.permissions) {
            mergePermission(permMap, perm);
          }
        }
      }
    }

    for (const perm of customPermissions) {
      mergePermission(permMap, perm);
    }

    return {
      permissions: Array.from(permMap.values()),
      pluginsWithPermissions,
    };
  },
};
