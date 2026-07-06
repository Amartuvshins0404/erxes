import type { OperationMeta } from './operationRegistry';
import {
  actionsToAllowedTools,
  assertAllowedToolsInvariant,
  isReadActionName,
  readEntity,
  type GroupPermission,
  type RegistryView,
} from './actionsToAllowedTools';

// --- fixtures --------------------------------------------------------------

const op = (
  operation: string,
  operationType: 'query' | 'mutation',
  plugin: string,
  module: string,
): OperationMeta => ({
  operation,
  operationType,
  plugin,
  module,
  description: '',
  graphqlArgs: [],
  returnType: null,
});

// A small, realistic sales surface: deal reads (query) + writes (mutation).
const OPS: OperationMeta[] = [
  op('deals', 'query', 'sales', 'deals'),
  op('dealDetail', 'query', 'sales', 'deal'),
  op('dealsAdd', 'mutation', 'sales', 'deals'),
  op('dealsEdit', 'mutation', 'sales', 'deals'),
  op('dealsRemove', 'mutation', 'sales', 'deals'),
  op('boardsAdd', 'mutation', 'sales', 'boards'),
];

const registry = (list: OperationMeta[] = OPS): RegistryView => {
  const operations = new Map<string, OperationMeta>();
  // Last-wins on duplicate name mirrors the real registry's Map build.
  for (const o of list) operations.set(o.operation, o);
  return { operations, list };
};

const perm = (
  plugin: string,
  module: string,
  actions: string[],
): GroupPermission => ({ plugin, module, actions, scope: 'all' });

// --- helpers ---------------------------------------------------------------

describe('read-action heuristics', () => {
  it('recognizes show* and *Read gates', () => {
    expect(isReadActionName('showDeals')).toBe(true);
    expect(isReadActionName('posOrderRead')).toBe(true);
    expect(isReadActionName('dealsAdd')).toBe(false);
  });

  it('normalizes the read entity for module matching', () => {
    expect(readEntity('showDeals')).toBe('deal'); // strip show + plural s
    expect(readEntity('posOrderRead')).toBe('posorder');
  });
});

// --- mapping ---------------------------------------------------------------

describe('actionsToAllowedTools', () => {
  it('maps write actions to their exact operation names', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsAdd', 'dealsEdit'])],
      registry(),
    );
    expect(out).toEqual(['dealsAdd', 'dealsEdit']); // sorted + exact
  });

  it('maps a show/read gate to the module\'s read (query) ops only', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['showDeals'])],
      registry(),
    );
    // Both deal queries (module "deals" and "deal" collapse to "deal"); NO writes.
    expect(out).toEqual(['dealDetail', 'deals']);
    expect(out).not.toContain('dealsAdd');
  });

  it('combines reads + writes for a full-module grant, deduped + sorted', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['showDeals', 'dealsAdd', 'dealsAdd', 'dealsEdit'])],
      registry(),
    );
    expect(out).toEqual(['dealDetail', 'deals', 'dealsAdd', 'dealsEdit']);
  });

  it('scopes exact matches to the granted plugin (ignores same-named foreign op)', () => {
    // A registry where the only 'dealsAdd' belongs to plugin 'other'.
    const foreign = registry([op('dealsAdd', 'mutation', 'other', 'deals')]);
    // A SALES grant of dealsAdd must NOT emit the foreign 'other' op (plugin
    // mismatch → fail-closed drop).
    expect(actionsToAllowedTools([perm('sales', 'deal', ['dealsAdd'])], foreign))
      .toEqual([]);
    // The matching plugin's grant emits it.
    expect(actionsToAllowedTools([perm('other', 'deals', ['dealsAdd'])], foreign))
      .toEqual(['dealsAdd']);
  });

  it('drops the "*" wildcard (grants nothing server-side → stays in lock-step)', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['*'])],
      registry(),
    );
    expect(out).toEqual([]);
  });

  it('drops unresolved actions with no matching op (fail-closed)', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsTeleport', 'dealsAdd'])],
      registry(),
    );
    expect(out).toEqual(['dealsAdd']); // the unknown action is silently dropped
  });

  it('returns [] for an empty registry (introspection unavailable → fail closed)', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsAdd', 'showDeals'])],
      registry([]),
    );
    expect(out).toEqual([]);
  });

  it('handles empty / null input', () => {
    expect(actionsToAllowedTools([], registry())).toEqual([]);
    expect(actionsToAllowedTools(null, registry())).toEqual([]);
  });
});

// --- the safety invariant --------------------------------------------------

describe('assertAllowedToolsInvariant', () => {
  it('passes for legitimately derived output', () => {
    const perms = [perm('sales', 'deal', ['showDeals', 'dealsAdd'])];
    const out = actionsToAllowedTools(perms, registry());
    expect(() =>
      assertAllowedToolsInvariant(out, perms, registry()),
    ).not.toThrow();
  });

  it('ignores widen entries (plugin:/module:/builtin:)', () => {
    expect(() =>
      assertAllowedToolsInvariant(
        ['plugin:sales', 'module:deals', 'builtin:calculator'],
        [perm('sales', 'deal', [])],
        registry(),
      ),
    ).not.toThrow();
  });

  it('throws when an emitted op is NOT covered by any granted action', () => {
    // dealsRemove was never granted — a mapper bug that emitted it must be caught.
    expect(() =>
      assertAllowedToolsInvariant(
        ['dealsRemove'],
        [perm('sales', 'deal', ['dealsAdd'])],
        registry(),
      ),
    ).toThrow(/not covered/i);
  });

  it('throws when an emitted op is unknown to the registry', () => {
    expect(() =>
      assertAllowedToolsInvariant(
        ['ghostOp'],
        [perm('sales', 'deal', ['ghostOp'])],
        registry(),
      ),
    ).toThrow(/not a known operation/i);
  });
});
