import type { IModels } from '~/connectionResolvers';
import { getOperationRegistry } from '~/mastra/tools/operationRegistry';
import { BUILTIN_TOOLS } from '~/mastra/tools/builtins';
import {
  actionsToAllowedTools,
  assertAllowedToolsInvariant,
  type GroupPermission,
} from '~/mastra/tools/actionsToAllowedTools';

// Builtin tools (calculator, web search, doc/chart generators, …) are NOT
// permission-gated — they carry no erxes action. The grant surface only picks
// erxes OPERATION access, so when we flip an agent to toolPolicy:'custom' we
// preserve every builtin; otherwise switching a grant on would silently strip
// the calculator etc. that an 'all'-policy agent had.
const builtinEntries = (): string[] =>
  Object.keys(BUILTIN_TOOLS).map((key) => `builtin:${key}`);

/**
 * Resolve the DERIVED `allowedTools` for a grant group's permissions:
 * introspect the live operation registry, map granted actions → operation
 * names (fail-closed — see actionsToAllowedTools), verify the safety invariant,
 * then append the (non-gated) builtins.
 *
 * Refresh the live registry when access is saved so newly available plugin
 * operations are included immediately instead of waiting for the registry TTL.
 * Preserve operations derived from the current registry if the refresh has
 * incomplete subgraph attribution, so a transient failure cannot narrow a
 * previously valid grant.
 * Registry unavailable / empty (a transient introspection blip that even
 * `getOperationRegistry`'s last-good tier can't cover) → no erxes ops resolve,
 * so the agent gets builtins only until the next save re-derives. Fail-closed:
 * the grant group remains the enforced boundary regardless.
 */
export async function deriveGrantAllowedTools(
  models: IModels,
  groupPermissions: GroupPermission[],
): Promise<string[]> {
  const settings = await models.MastraSettings.getSettings();
  const currentRegistry = await getOperationRegistry(settings);
  const refreshedRegistry = await getOperationRegistry(settings, { force: true });

  const currentTools = actionsToAllowedTools(groupPermissions, currentRegistry);
  const refreshedTools = actionsToAllowedTools(
    groupPermissions,
    refreshedRegistry,
  );
  // Defense-in-depth: verify each result against the registry that produced it
  // before combining them, so every emitted operation remains grant-covered.
  assertAllowedToolsInvariant(
    currentTools,
    groupPermissions,
    currentRegistry,
  );
  assertAllowedToolsInvariant(
    refreshedTools,
    groupPermissions,
    refreshedRegistry,
  );

  return [
    ...new Set([...currentTools, ...refreshedTools]),
    ...builtinEntries(),
  ];
}
