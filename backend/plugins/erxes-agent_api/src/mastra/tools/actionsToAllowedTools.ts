import type { AgentToolDescriptor } from 'erxes-api-shared/utils';

// ---------------------------------------------------------------------------
// actionsToAllowedTools — DERIVE the agent's tool-registry filter
// (`allowedTools`) from the permission ACTIONS its grant group carries.
//
// The permission group is authoritative and server-enforced through the AI
// team member's linked account (each plugin's /agent-tools/call re-checks the
// descriptor permission as that user). This tool filter is a DERIVED,
// best-effort mirror, so the agent's model doesn't even see tools it isn't
// permitted to run.
//
// Safety contract (fail-closed on the tool side):
//   - A native tool is emitted only when a granted permission covers it:
//     the plugin matches (an empty plugin entry is a wildcard), the module
//     matches tolerantly (case-insensitive, singular/plural 's' variants),
//     and the granted actions include the descriptor's permission action.
//   - tRPC tools carry no derived permission: they are emitted when the agent
//     holds ANY concrete action on that plugin + module.
//   - Anything we cannot confidently resolve is DROPPED — never emitted.
//   - The group stays exact; an under-broad derivation is only a UX gap (the
//     agent can't call a tool it's actually permitted to), NEVER an escalation:
//     `isOperationAllowed` is an exact-match allowlist that can't exceed the
//     server-enforced group boundary.
//
// INVARIANT (see assertAllowedToolsInvariant): every emitted bare tool id maps
// back to a granted permission for that plugin/module.
// ---------------------------------------------------------------------------

/** One entry of a permission group's `permissions` array (core shape). */
export interface GroupPermission {
  plugin?: string;
  module?: string;
  actions?: string[];
  scope?: string;
}

/** The registry surface the mapper needs — id lookup + the tool list. */
export type RegistryView = {
  tools: Map<string, AgentToolDescriptor>;
  list: AgentToolDescriptor[];
};

// Normalize a module-ish token for lenient matching: lowercase + strip ONE
// trailing plural 's'. The permission module vocab is singular ("deal") while
// the manifest derives modules from model names ("deals"), so both sides
// collapse to a shared key ("deal").
const normModule = (s: string): string => s.toLowerCase().replace(/s$/, '');

/** True when the granted permission covers this native tool. */
const permissionCovers = (
  tool: AgentToolDescriptor,
  permission: GroupPermission,
): boolean => {
  if (permission.plugin && tool.plugin !== permission.plugin) return false;
  if (
    permission.module?.trim() &&
    normModule(tool.module) !== normModule(permission.module)
  ) {
    return false;
  }

  const actions = Array.isArray(permission.actions) ? permission.actions : [];

  if (tool.permission) {
    return actions.includes(tool.permission.action);
  }

  // tRPC tools without a derived permission: allowed when the agent holds any
  // concrete action on that plugin + module ("*" grants nothing server-side,
  // so it stays dropped here too — lock-step with the permission service).
  return actions.some((action) => action && action !== '*');
};

/**
 * Map a grant group's permissions to a tool-filter allowlist of bare native
 * tool ids. Pure + deterministic: dedup + stable (sorted) output.
 *
 * Empty registry (manifests transiently unavailable) → returns [] so the
 * caller fails closed rather than widening.
 */
export function actionsToAllowedTools(
  groupPermissions: GroupPermission[] | null | undefined,
  registry: RegistryView,
): string[] {
  const out = new Set<string>();

  for (const permission of groupPermissions || []) {
    for (const tool of registry.list) {
      if (permissionCovers(tool, permission)) out.add(tool.id);
    }
  }

  return [...out].sort((a, b) => a.localeCompare(b));
}

/**
 * Independent safety net for the derivation: re-verify — WITHOUT reusing the
 * builder's bookkeeping — that every emitted bare tool id is covered by a
 * granted permission. `plugin:`/`module:`/`builtin:` widen entries are exempt
 * (they are not tool-id emissions). Throws when a bare tool id cannot be traced
 * back to a grant, so a future mapper bug fails loudly instead of silently
 * granting the agent a tool it wasn't permitted to see.
 */
export function assertAllowedToolsInvariant(
  allowedTools: string[],
  groupPermissions: GroupPermission[] | null | undefined,
  registry: RegistryView,
): void {
  const permissions = groupPermissions || [];

  for (const entry of allowedTools) {
    if (entry.includes(':')) continue; // widen entry (plugin:/module:/builtin:)

    const tool = registry.tools.get(entry);
    if (!tool) {
      throw new Error(
        `actionsToAllowedTools emitted "${entry}" which is not a known tool`,
      );
    }

    if (!permissions.some((permission) => permissionCovers(tool, permission))) {
      throw new Error(
        `actionsToAllowedTools emitted "${entry}" not covered by any granted permission`,
      );
    }
  }
}
