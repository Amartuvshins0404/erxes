jest.mock('@mastra/core/tools', () => ({
  createTool: (config: unknown) => config,
}));

const mockExecute = jest.fn((...args: unknown[]) => {
  void args;
  return Promise.resolve({ ok: true });
});

jest.mock('../erxesTools', () => ({
  executeErxesOperation: (...args: unknown[]) => mockExecute(...args),
}));

import { buildErxesOperationTools } from '../operationTools';
import { runWithAuth } from '../../requestContext';
import type { OperationRegistry, OperationMeta } from '../operationRegistry';
import type { AgentActionInput } from '../../auditLog';

const makeRegistry = (
  ops: Array<Partial<OperationMeta>>,
): OperationRegistry => {
  const list = ops.map(
    (operation) =>
      ({
        operation: operation.operation || 'x',
        operationType: operation.operationType || 'mutation',
        plugin: operation.plugin || 'core',
        module: operation.module || 'customers',
        description: '',
        graphqlArgs: [],
        returnType: null,
      } as OperationMeta),
  );
  return {
    operations: new Map(
      list.map((operation) => [operation.operation, operation]),
    ),
    list,
    inputTypesMap: {},
    objectFieldsMap: {},
    enumValuesMap: {},
  };
};

interface ToolLike {
  execute: (
    input: Record<string, unknown>,
  ) => Promise<
    { blocked?: boolean; requiresApproval?: boolean } & Record<string, unknown>
  >;
}

const build = (
  operation: Partial<OperationMeta>,
  calls: AgentActionInput[],
): ToolLike => {
  const registry = makeRegistry([operation]);
  const tools = buildErxesOperationTools({
    registry,
    policy: { mode: 'all', allowed: [] },
    recordAction: (entry) => calls.push(entry),
  });
  return tools[registry.list[0].operation] as unknown as ToolLike;
};

beforeEach(() => mockExecute.mockClear());

describe('typed operation guard and audit', () => {
  it('asks for approval on a destructive operation and never executes it', async () => {
    const calls: AgentActionInput[] = [];
    const tool = build(
      { operation: 'customersRemove', operationType: 'mutation' },
      calls,
    );

    const result = await tool.execute({ _ids: ['c1'] });

    expect(result.requiresApproval).toBe(true);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(calls[0]).toMatchObject({
      operation: 'customersRemove',
      destructive: true,
      status: 'blocked',
    });
  });

  it('executes a destructive operation approved for this turn', async () => {
    const calls: AgentActionInput[] = [];
    const tool = build(
      { operation: 'customersRemove', operationType: 'mutation' },
      calls,
    );

    const result = await runWithAuth(
      { approvedOps: [{ operation: 'customersRemove', args: {} }] },
      () => tool.execute({ _ids: ['c1'] }),
    );

    expect(result.requiresApproval).toBeUndefined();
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(calls[0]).toMatchObject({ status: 'success' });
  });

  it('records failed mutations and leaves reads untracked', async () => {
    mockExecute.mockResolvedValueOnce({
      success: false,
      error: 'boom',
    } as never);
    const failedCalls: AgentActionInput[] = [];
    await build(
      { operation: 'dealsEdit', operationType: 'mutation' },
      failedCalls,
    ).execute({});
    expect(failedCalls[0]).toMatchObject({ status: 'failed', error: 'boom' });

    const readCalls: AgentActionInput[] = [];
    await build(
      { operation: 'customers', operationType: 'query' },
      readCalls,
    ).execute({});
    expect(readCalls).toHaveLength(0);
  });
});
