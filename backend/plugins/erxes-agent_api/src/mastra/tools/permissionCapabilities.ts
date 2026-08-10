import { getPlugin, getPlugins, sendTRPCMessage } from 'erxes-api-shared/utils';
import { normalizeAdditionalToolKeys } from './additionalTools';
import {
  actionsToAllowedTools,
  assertAllowedToolsInvariant,
  type GroupPermission,
  type RegistryView,
} from './actionsToAllowedTools';

export interface AgentPermissionGroup {
  _id: string;
  name?: string;
  permissions?: GroupPermission[];
}

interface DefaultPermissionGroup {
  id: string;
  permissions?: GroupPermission[];
  plugin?: string;
}

const additionalBuiltinEntries = (additionalTools?: string[]): string[] =>
  normalizeAdditionalToolKeys(additionalTools).map((key) => `builtin:${key}`);

const getDefaultPermissionGroups = async (): Promise<
  DefaultPermissionGroup[]
> => {
  const pluginNames = await getPlugins();
  const plugins = await Promise.all(
    pluginNames.map((pluginName) => getPlugin(pluginName)),
  );
  return plugins.flatMap((plugin, index) =>
    (plugin?.config?.meta?.permissions?.defaultGroups ?? []).map(
      (group: DefaultPermissionGroup) => ({
        ...group,
        plugin: pluginNames[index],
      }),
    ),
  );
};

const mergePermissions = (
  permissionSets: GroupPermission[][],
): GroupPermission[] => {
  const merged = new Map<string, GroupPermission>();
  const scopePriority: Record<string, number> = { own: 1, group: 2, all: 3 };

  for (const permission of permissionSets.flat()) {
    const key = `${permission.plugin || ''}:${permission.module}`;
    const current = merged.get(key);
    if (!current) {
      merged.set(key, {
        ...permission,
        actions: [...new Set(permission.actions ?? [])],
      });
      continue;
    }
    current.actions = [
      ...new Set([...(current.actions ?? []), ...(permission.actions ?? [])]),
    ];
    if (
      scopePriority[permission.scope || 'own'] >
      scopePriority[current.scope || 'own']
    ) {
      current.scope = permission.scope;
    }
  }

  return [...merged.values()];
};

export async function resolveAgentPermissions(opts: {
  subdomain: string;
  permissionGroupIds: string[];
  customPermissions?: GroupPermission[];
}): Promise<{ permissions: GroupPermission[]; foundGroupIds: string[] }> {
  const groupIds = [...new Set(opts.permissionGroupIds.filter(Boolean))];
  const defaultIds = groupIds.filter((id) => id.includes(':'));
  const customIds = groupIds.filter((id) => !id.includes(':'));
  const [defaultGroups, customGroups]: [DefaultPermissionGroup[], unknown] =
    await Promise.all([
      defaultIds.length ? getDefaultPermissionGroups() : [],
      customIds.length
        ? sendTRPCMessage({
            subdomain: opts.subdomain,
            pluginName: 'core',
            module: 'permissionGroups',
            action: 'find',
            method: 'query',
            input: { query: { _id: { $in: customIds } } },
            defaultValue: [],
          })
        : [],
    ]);
  const selectedDefaults = defaultGroups.filter((group) =>
    defaultIds.includes(group.id),
  );
  const selectedCustoms = (
    Array.isArray(customGroups) ? (customGroups as AgentPermissionGroup[]) : []
  ).filter((group) => customIds.includes(group._id));

  const permissionSets: GroupPermission[][] = [
    ...selectedDefaults.map((group) =>
      (group.permissions ?? []).map((permission) => ({
        ...permission,
        plugin: permission.plugin || group.plugin,
      })),
    ),
    ...selectedCustoms.map((group) => group.permissions ?? []),
    opts.customPermissions ?? [],
  ];

  return {
    permissions: mergePermissions(permissionSets),
    foundGroupIds: [
      ...selectedDefaults.map((group) => group.id),
      ...selectedCustoms.map((group) => group._id),
    ],
  };
}

export function deriveAgentAllowedTools(
  permissions: GroupPermission[],
  registry: RegistryView,
  additionalTools?: string[],
): string[] {
  const erxesTools = actionsToAllowedTools(permissions, registry);
  assertAllowedToolsInvariant(erxesTools, permissions, registry);
  return [
    ...new Set([
      ...erxesTools,
      ...additionalBuiltinEntries(additionalTools),
    ]),
  ].sort((a, b) => a.localeCompare(b));
}

export async function resolveAgentAllowedTools(opts: {
  subdomain: string;
  permissionGroupIds: string[];
  customPermissions?: GroupPermission[];
  additionalTools?: string[];
  registry: RegistryView;
}): Promise<string[]> {
  const { permissions } = await resolveAgentPermissions(opts);
  return deriveAgentAllowedTools(
    permissions,
    opts.registry,
    opts.additionalTools,
  );
}
