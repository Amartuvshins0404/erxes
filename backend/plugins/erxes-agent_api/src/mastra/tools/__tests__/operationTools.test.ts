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
  operationType: 'query' | 'mutation' = 'mutation',
): OperationMeta => ({
  operation,
  operationType,
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

  it('adds compact live-name search terms for natural CRUD requests', () => {
    const tool = build(makeRegistry([makeOperation('dealsAdd')]))
      .dealsAdd as unknown as ToolLike;

    expect(tool.description).toContain(
      'Search terms: dealsAdd deals deal add create',
    );
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
});
