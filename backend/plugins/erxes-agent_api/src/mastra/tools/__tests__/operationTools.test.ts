jest.mock('@mastra/core/tools', () => ({
  createTool: (config: unknown) => config,
}));

const mockExecute = jest.fn((...args: unknown[]) => {
  void args;
  return Promise.resolve({ _id: 'deal-1' });
});

jest.mock('../erxesTools', () => ({
  executeErxesOperation: (...args: unknown[]) => mockExecute(...args),
}));

jest.mock('../operationHints', () => ({
  getStaticOperationHints: (operation: string) =>
    operation === 'guardedAdd'
      ? {
          required: ['doc.name'],
          enums: { 'doc.status': ['active', 'archived'] },
          rules: ['doc.name and doc.status must be supplied'],
        }
      : undefined,
}));

import { buildErxesOperationTools } from '../operationTools';
import type { OperationMeta, OperationRegistry } from '../operationRegistry';
import type { GqlArgDef, GqlTypeRef } from '../schemaIntrospect';

const scalar = (name: string): GqlTypeRef => ({ kind: 'SCALAR', name });
const enumType = (name: string): GqlTypeRef => ({ kind: 'ENUM', name });
const inputType = (name: string): GqlTypeRef => ({
  kind: 'INPUT_OBJECT',
  name,
});
const nonNull = (ofType: GqlTypeRef): GqlTypeRef => ({
  kind: 'NON_NULL',
  ofType,
});

const makeOperation = (
  operation: string,
  graphqlArgs: GqlArgDef[] = [],
): OperationMeta => ({
  operation,
  operationType: 'mutation',
  plugin: 'sales',
  module: 'deals',
  description: `Run ${operation}`,
  graphqlArgs,
  returnType: null,
});

const makeRegistry = (
  list: OperationMeta[],
  inputTypesMap: Record<string, GqlArgDef[]> = {},
  enumValuesMap: Record<string, string[]> = {},
): OperationRegistry => ({
  operations: new Map(
    list.map((operation) => [operation.operation, operation]),
  ),
  list,
  inputTypesMap,
  enumValuesMap,
  objectFieldsMap: {},
});

interface ToolLike {
  description: string;
  inputSchema: {
    safeParse: (input: unknown) => {
      success: boolean;
      data?: Record<string, unknown>;
    };
  };
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

const build = (
  registry: OperationRegistry,
  policy: { mode: 'all' | 'custom'; allowed: string[] } = {
    mode: 'all',
    allowed: [],
  },
) =>
  buildErxesOperationTools({
    registry,
    policy,
    destructiveOps: 'allow',
  });

beforeEach(() => mockExecute.mockClear());

describe('typed erxes operation tools', () => {
  it('creates only permitted operation tools', () => {
    const registry = makeRegistry([
      makeOperation('dealsAdd'),
      makeOperation('dealsEdit'),
    ]);

    const tools = build(registry, {
      mode: 'custom',
      allowed: ['dealsAdd'],
    });

    expect(Object.keys(tools)).toEqual(['dealsAdd']);
  });

  it('adds natural-language aliases for operation discovery', () => {
    const registry = makeRegistry([makeOperation('dealsAdd')]);
    const tool = build(registry).dealsAdd as unknown as ToolLike;

    expect(tool.description).toContain('Search terms:');
    expect(tool.description).toMatch(/\bcreate\b/);
    expect(tool.description).toMatch(/\bdeal\b/);
  });

  it('exposes required nested input fields and canonical enum values', () => {
    const operation = makeOperation('dealsAdd', [
      { name: 'name', type: nonNull(scalar('String')) },
      { name: 'doc', type: nonNull(inputType('DealInput')) },
    ]);
    const registry = makeRegistry(
      [operation],
      {
        DealInput: [
          { name: 'stageId', type: nonNull(scalar('ID')) },
          { name: 'status', type: enumType('DealStatus') },
        ],
      },
      { DealStatus: ['OPEN', 'WON'] },
    );
    const tool = build(registry).dealsAdd as unknown as ToolLike;

    expect(tool.inputSchema.safeParse({}).success).toBe(false);
    expect(
      tool.inputSchema.safeParse({
        name: 'Enterprise',
        doc: { stageId: 'stage-1', status: 'won' },
      }),
    ).toMatchObject({
      success: true,
      data: {
        name: 'Enterprise',
        doc: { stageId: 'stage-1', status: 'WON' },
      },
    });
    expect(tool.description).toContain(
      'dealsAdd(name: String!, doc: DealInput!)',
    );
  });

  it('enforces server-only nested requirements and enum hints before execution', () => {
    const operation = makeOperation('guardedAdd', [
      { name: 'doc', type: nonNull(inputType('GuardedInput')) },
    ]);
    const registry = makeRegistry([operation], {
      GuardedInput: [
        { name: 'name', type: scalar('String') },
        { name: 'status', type: scalar('String') },
      ],
    });
    const tool = build(registry).guardedAdd as unknown as ToolLike;

    expect(tool.inputSchema.safeParse({ doc: {} }).success).toBe(false);
    expect(
      tool.inputSchema.safeParse({
        doc: { name: 'Record', status: 'unknown' },
      }).success,
    ).toBe(false);
    expect(
      tool.inputSchema.safeParse({
        doc: { name: 'Record', status: 'active' },
      }).success,
    ).toBe(true);
  });

  it('passes direct arguments and normalized response fields to the shared executor', async () => {
    const operation = makeOperation('dealsAdd', [
      { name: 'name', type: nonNull(scalar('String')) },
    ]);
    const registry = makeRegistry([operation]);
    const tool = build(registry).dealsAdd as unknown as ToolLike;

    const parsed = tool.inputSchema.safeParse({
      name: 'Enterprise',
      __responseFields: '_id, name',
    });
    expect(parsed.success).toBe(true);

    await tool.execute(parsed.data || {});

    expect(mockExecute).toHaveBeenCalledWith(
      operation,
      { name: 'Enterprise' },
      registry,
      expect.any(String),
      ['_id', 'name'],
    );
  });
});
