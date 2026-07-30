import type { OperationMeta } from './operationRegistry';

// ---------------------------------------------------------------------------
// actionsToAllowedTools — DERIVE the agent's tool-registry filter
// (`allowedTools`) from the permission ACTIONS its grant group carries.
//
// Selection model A (step 23): the permission group is AUTHORITATIVE and
// server-enforced (a background run mints the AI team member's token, whose
// actions ARE the group's and are checked by `canGroup`/`checkPermission`).
// This tool filter is a DERIVED, best-effort mirror, so the agent's model
// doesn't even see tools it isn't permitted to run.
//
// Safety contract (fail-closed on the tool side):
//   - We only ever emit a bare "<operationName>" when a granted action clearly
//     maps to it (exact name match, or a read gate → that module's read ops).
//   - Anything we cannot confidently resolve is DROPPED — never emitted.
//   - The group stays exact; an under-broad derivation is only a UX gap (the
//     agent can't call a tool it's actually permitted to), NEVER an escalation:
//     `isOperationAllowed` is an exact-match allowlist that can't exceed the
//     server-enforced group boundary.
//
// INVARIANT (see assertAllowedToolsInvariant): every emitted bare operation
// name maps back to a granted action for that plugin/module.
// ---------------------------------------------------------------------------

/** One entry of a permission group's `permissions` array (core shape). */
export interface GroupPermission {
  plugin?: string;
  module?: string;
  actions?: string[];
  scope?: string;
}

/** The registry surface the mapper needs — name lookup + the op list. */
export type RegistryView = {
  operations: Map<string, OperationMeta>;
  list: OperationMeta[];
};

// Normalize a module-ish token for lenient matching: lowercase + strip ONE
// trailing plural 's'. The permission module vocab is singular ("deal") while
// the registry derives modules from operation names ("deals", "dealDetail" →
// "deal"), so both sides collapse to a shared key ("deal").
const normModule = (s: string): string => s.toLowerCase().replace(/s$/, '');

// A read/view gate rather than a concrete write op: erxes declares these as
// `show<Module>` (always:true view gates) or `<entity>Read` conventions.
export const isReadActionName = (a: string): boolean =>
  /^show/i.test(a) || /read$/i.test(a);

// The entity a read gate refers to, normalized for module matching:
// "showDeals" → "deal", "posOrderRead" → "posorder".
export const readEntity = (a: string): string =>
  normModule(a.replace(/^show/i, '').replace(/read$/i, ''));

/** True when `op` is a read op whose module matches a read gate's entity. */
const readOpMatches = (op: OperationMeta, entity: string): boolean =>
  op.operationType === 'query' && normModule(op.module) === entity;

const WRITE_ACTION_SUFFIX = /(Create|Add|Update|Edit|Remove|Delete)$/i;

const writeVerbAliases = (action: string): string[] => {
  const suffix = action.match(WRITE_ACTION_SUFFIX)?.[1]?.toLowerCase();
  if (suffix === 'create' || suffix === 'add') return ['create', 'add'];
  if (suffix === 'update' || suffix === 'edit') return ['update', 'edit'];
  if (suffix === 'remove' || suffix === 'delete') return ['remove', 'delete'];
  return [];
};

const writeOpMatches = (
  op: OperationMeta,
  permissionModule: string | undefined,
  action: string,
): boolean => {
  if (op.operationType !== 'mutation' || !permissionModule) return false;
  if (normModule(op.module) !== normModule(permissionModule)) return false;
  const operationName = op.operation.toLowerCase();
  return writeVerbAliases(action).some((verb) => operationName.includes(verb));
};

/**
 * Map a grant group's permissions to a tool-filter allowlist of bare operation
 * names. Pure + deterministic: dedup + stable (sorted) output.
 *
 * Mapping per granted action:
 *   (i)   name === an operation name exactly (and same plugin, when known)
 *         → emit that "<operationName>" (covers every write action, whose name
 *           IS the mutation name: dealsAdd → dealsAdd).
 *   (ii)  a read/show gate (showDeals / posOrderRead) → emit that module's READ
 *         operations; a standard Create/Add/Update/Edit/Remove/Delete action
 *         → emit same-module mutations with the corresponding verb.
 *         "*" grants nothing server-side (`canGroup` keys on concrete action
 *         names, never "*"), so the tool side stays in lock-step by dropping it
 *         too; the UI expands "all" to explicit names before it is ever stored.
 *
 * Empty registry (introspection transiently unavailable) → returns [] so the
 * caller fails closed rather than widening.
 */
export function actionsToAllowedTools(
  groupPermissions: GroupPermission[] | null | undefined,
  registry: RegistryView,
): string[] {
  const out = new Set<string>();
  const byName = registry.operations;
  const ops = registry.list;

  for (const perm of groupPermissions || []) {
    const plugin = perm.plugin;
    const actions = Array.isArray(perm.actions) ? perm.actions : [];

    for (const action of actions) {
      if (!action || action === '*') continue; // (iii) wildcard → drop

      // (i) exact operation-name match — the tightest, invariant-safe mapping.
      const op = byName.get(action);
      if (op && (!plugin || op.plugin === plugin)) {
        out.add(op.operation);
        continue;
      }

      // (ii) read/view gate → that module's read (query) ops.
      if (isReadActionName(action)) {
        const entity = readEntity(action);
        for (const candidate of ops) {
          if (!readOpMatches(candidate, entity)) continue;
          if (plugin && candidate.plugin !== plugin) continue;
          out.add(candidate.operation);
        }
        continue;
      }

      // Standard write gates commonly use taskCreate while GraphQL exposes
      // createTask. Match only the same plugin/module and verb family.
      for (const candidate of ops) {
        if (plugin && candidate.plugin !== plugin) continue;
        if (writeOpMatches(candidate, perm.module, action)) {
          out.add(candidate.operation);
        }
      }

      // (iii) unresolved → drop (fail-closed).
    }
  }

  return [...out].sort((a, b) => a.localeCompare(b));
}

/**
 * Independent safety net for the derivation: re-verify — WITHOUT reusing the
 * builder's bookkeeping — that every emitted bare operation name is covered by
 * a granted action. `plugin:`/`module:`/`builtin:` widen entries are exempt
 * (they are not op-name emissions). Throws when a bare op name cannot be traced
 * back to a grant, so a future mapper bug fails loudly instead of silently
 * granting the agent a tool it wasn't permitted to see.
 */
export function assertAllowedToolsInvariant(
  allowedTools: string[],
  groupPermissions: GroupPermission[] | null | undefined,
  registry: RegistryView,
): void {
  const perms = groupPermissions || [];

  for (const entry of allowedTools) {
    if (entry.includes(':')) continue; // widen entry (plugin:/module:/builtin:)

    const op = registry.operations.get(entry);
    if (!op) {
      throw new Error(
        `actionsToAllowedTools emitted "${entry}" which is not a known operation`,
      );
    }

    const covered = perms.some((p) => {
      if (p.plugin && op.plugin !== p.plugin) return false;
      const actions = Array.isArray(p.actions) ? p.actions : [];
      // exact write/op grant
      if (actions.includes(op.operation)) return true;
      // read gate covering this query op's module
      return actions.some(
        (action) =>
          (isReadActionName(action) && readOpMatches(op, readEntity(action))) ||
          writeOpMatches(op, p.module, action),
      );
    });

    if (!covered) {
      throw new Error(
        `actionsToAllowedTools emitted "${entry}" not covered by any granted action`,
      );
    }
  }
}
