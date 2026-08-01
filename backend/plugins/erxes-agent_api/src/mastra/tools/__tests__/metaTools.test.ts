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
  destructiveOps: 'allow' | 'ask',
  calls: AgentActionInput[],
): ToolLike => {
  const registry = makeRegistry([operation]);
  const tools = buildErxesOperationTools({
    registry,
    policy: { mode: 'all', allowed: [] },
    destructiveOps,
    recordAction: (entry) => calls.push(entry),
  });
  return tools[registry.list[0].operation] as unknown as ToolLike;
};

beforeEach(() => mockExecute.mockClear());

describe('typed operation guard and audit', () => {
  it('asks for approval on a destructive op, records it, and never executes it', async () => {
    const calls: AgentActionInput[] = [];
    const tool = build(
      { operation: 'customersRemove', operationType: 'mutation' },
      'ask',
      calls,
    );

    const result = await tool.execute({ _ids: ['c1'] });

    expect(result.requiresApproval).toBe(true);
    expect(mockExecute).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      operation: 'customersRemove',
      destructive: true,
      status: 'blocked',
    });
    expect(calls[0].processId).toBeUndefined();
  });

  it('executes a destructive op approved for this turn', async () => {
    const calls: AgentActionInput[] = [];
    const tool = build(
      { operation: 'customersRemove', operationType: 'mutation' },
      'ask',
      calls,
    );

    const result = await runWithAuth(
      {
        approvedOps: [{ operation: 'customersRemove', args: { _ids: ['c1'] } }],
      },
      () => tool.execute({ _ids: ['c1'] }),
    );

    expect(result.requiresApproval).toBeUndefined();
    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(calls[0]).toMatchObject({
      operation: 'customersRemove',
      destructive: true,
      status: 'success',
    });
  });

  it('records a successful mutation and correlation id when destructive operations are allowed', async () => {
    const calls: AgentActionInput[] = [];
    const tool = build(
      { operation: 'customersRemove', operationType: 'mutation' },
      'allow',
      calls,
    );

    await tool.execute({});

    expect(mockExecute).toHaveBeenCalledTimes(1);
    const sentProcessId = mockExecute.mock.calls[0]?.[3];
    expect(sentProcessId).toEqual(expect.any(String));
    expect(sentProcessId).toMatch(/^agt_/);
    expect(calls[0]).toMatchObject({
      operation: 'customersRemove',
      destructive: true,
      status: 'success',
      processId: sentProcessId,
    });
  });

  it('records a failed mutation', async () => {
    mockExecute.mockResolvedValueOnce({
      success: false,
      error: 'boom',
    } as never);
    const calls: AgentActionInput[] = [];
    const tool = build(
      { operation: 'dealsEdit', operationType: 'mutation' },
      'ask',
      calls,
    );

    await tool.execute({});

    expect(calls[0]).toMatchObject({ status: 'failed', error: 'boom' });
  });

  it('does not record reads or assign them correlation ids', async () => {
    const calls: AgentActionInput[] = [];
    const tool = build(
      { operation: 'customers', operationType: 'query' },
      'ask',
      calls,
    );

    await tool.execute({});

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockExecute.mock.calls[0][3]).toBeUndefined();
    expect(calls).toHaveLength(0);
  });
});
