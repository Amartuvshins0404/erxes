import type { AgentToolDescriptor } from 'erxes-api-shared/utils';
import {
  actionsToAllowedTools,
  assertAllowedToolsInvariant,
  type GroupPermission,
  type RegistryView,
} from './actionsToAllowedTools';

// --- fixtures --------------------------------------------------------------

const modelTool = (
  modelName: string,
  op: 'find' | 'findOne' | 'count' | 'create' | 'update' | 'remove',
  plugin = 'sales',
): AgentToolDescriptor => {
  const module = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const actionByOp: Record<string, string> = {
    find: 'Show',
    findOne: 'Show',
    count: 'Show',
    create: 'Create',
    update: 'Update',
    remove: 'Remove',
  };
  return {
    id: `${plugin}.model.${modelName}.${op}`,
    kind: 'model',
    plugin,
    module,
    method: op === 'find' || op === 'findOne' || op === 'count'
      ? 'query'
      : 'mutation',
    destructive: op === 'create' || op === 'update' || op === 'remove',
    description: '',
    inputFields: null,
    modelName,
    op,
    permission: { module, action: `${module}${actionByOp[op]}` },
  };
};

const trpcTool = (
  path: string,
  plugin = 'sales',
  permission: AgentToolDescriptor['permission'] = null,
): AgentToolDescriptor => ({
  id: `${plugin}.trpc.${path}`,
  kind: 'trpc',
  plugin,
  module: path.split('.')[0],
  method: 'query',
  destructive: false,
  description: '',
  inputFields: null,
  permission,
  path,
});

// A small, realistic sales surface: deal reads + writes + a tRPC procedure.
const TOOLS: AgentToolDescriptor[] = [
  modelTool('Deals', 'find'),
  modelTool('Deals', 'findOne'),
  modelTool('Deals', 'create'),
  modelTool('Deals', 'update'),
  modelTool('Deals', 'remove'),
  trpcTool('deal.findOne'),
];

const registry = (list: AgentToolDescriptor[] = TOOLS): RegistryView => {
  const tools = new Map<string, AgentToolDescriptor>();
  for (const tool of list) tools.set(tool.id, tool);
  return { tools, list };
};

const perm = (
  plugin: string,
  module: string,
  actions: string[],
): GroupPermission => ({ plugin, module, actions, scope: 'all' });

// --- mapping ---------------------------------------------------------------

describe('actionsToAllowedTools', () => {
  it('emits model tools whose permission action is granted', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsShow'])],
      registry(),
    );
    expect(out).toEqual(['sales.model.Deals.find', 'sales.model.Deals.findOne']);
  });

  it('emits write tools only for their granted action', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsCreate', 'dealsRemove'])],
      registry(),
    );
    expect(out).toEqual([
      'sales.model.Deals.create',
      'sales.model.Deals.remove',
    ]);
    expect(out).not.toContain('sales.model.Deals.update');
  });

  it('matches modules tolerantly across singular/plural and case', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'Deal', ['dealsShow'])],
      registry(),
    );
    expect(out).toContain('sales.model.Deals.find');
  });

  it('scopes emissions to the granted plugin', () => {
    const out = actionsToAllowedTools(
      [perm('other', 'deal', ['dealsShow'])],
      registry(),
    );
    expect(out).toEqual([]);
  });

  it('treats an empty plugin entry as a wildcard', () => {
    const out = actionsToAllowedTools(
      [{ module: 'deal', actions: ['dealsShow'], scope: 'all' }],
      registry(),
    );
    expect(out).toEqual(['sales.model.Deals.find', 'sales.model.Deals.findOne']);
  });

  it('emits permission-less tRPC tools when any action matches plugin+module', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsShow'])],
      registry(),
    );
    expect(out).toContain('sales.trpc.deal.findOne');
  });

  it('drops the "*" wildcard (grants nothing server-side → stays in lock-step)', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['*'])],
      registry(),
    );
    expect(out).toEqual([]);
  });

  it('drops unresolved actions with no matching tool (fail-closed)', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsTeleport', 'dealsShow'])],
      registry(),
    );
    expect(out).not.toContain('sales.model.Deals.create');
    expect(out).toContain('sales.model.Deals.find');
  });

  it('returns [] for an empty registry (manifests unavailable → fail closed)', () => {
    const out = actionsToAllowedTools(
      [perm('sales', 'deal', ['dealsShow'])],
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
    const perms = [perm('sales', 'deal', ['dealsShow'])];
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

  it('throws when an emitted tool is NOT covered by any granted permission', () => {
    expect(() =>
      assertAllowedToolsInvariant(
        ['sales.model.Deals.remove'],
        [perm('sales', 'deal', ['dealsShow'])],
        registry(),
      ),
    ).toThrow(/not covered/i);
  });

  it('throws when an emitted tool is unknown to the registry', () => {
    expect(() =>
      assertAllowedToolsInvariant(
        ['sales.model.Ghost.find'],
        [perm('sales', 'deal', ['dealsShow'])],
        registry(),
      ),
    ).toThrow(/not a known tool/i);
  });
});
