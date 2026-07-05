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
  const registry = await getOperationRegistry(settings);

  const opTools = actionsToAllowedTools(groupPermissions, registry);
  // Defense-in-depth: throws if the mapper ever emits an op not covered by a
  // granted action, so a regression fails loudly instead of over-granting.
  assertAllowedToolsInvariant(opTools, groupPermissions, registry);

  return [...opTools, ...builtinEntries()];
}
