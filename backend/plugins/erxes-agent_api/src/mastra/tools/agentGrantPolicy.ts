import { sendTRPCMessage } from 'erxes-api-shared/utils';
import type { NativeToolRegistry } from './nativeTools';
import { BUILTIN_TOOLS } from './builtins';
import {
  actionsToAllowedTools,
  assertAllowedToolsInvariant,
  GroupPermission,
} from './actionsToAllowedTools';
import type { ToolPolicy } from './scope';

interface CorePermissionGroup {
  permissions?: GroupPermission[];
  principalType?: string;
}

const builtinTools = Object.keys(BUILTIN_TOOLS).map((key) => `builtin:${key}`);

const builtinOnlyPolicy = (): ToolPolicy => ({
  mode: 'custom',
  allowed: builtinTools,
});

export const resolveAgentGrantPolicy = async ({
  subdomain,
  grantGroupId,
  registry,
}: {
  subdomain?: string;
  grantGroupId?: string | null;
  registry: NativeToolRegistry;
}): Promise<ToolPolicy> => {
  const groupId = grantGroupId?.trim();
  if (!subdomain || !groupId) return builtinOnlyPolicy();

  const groups = await sendTRPCMessage({
    subdomain,
    pluginName: 'core',
    module: 'permissionGroups',
    action: 'find',
    method: 'query',
    input: { query: { _id: groupId } },
    defaultValue: [],
  });
  if (!Array.isArray(groups) || groups.length === 0) {
    return builtinOnlyPolicy();
  }

  const group = groups[0] as CorePermissionGroup;
  if (group.principalType !== 'agent') {
    return builtinOnlyPolicy();
  }
  const permissions = group.permissions || [];
  const operationTools = actionsToAllowedTools(permissions, registry);
  assertAllowedToolsInvariant(operationTools, permissions, registry);

  return { mode: 'custom', allowed: [...operationTools, ...builtinTools] };
};
