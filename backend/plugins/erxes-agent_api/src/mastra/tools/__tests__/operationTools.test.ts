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
  getStaticOperationHints: (operation: string) => {
    if (operation === 'guardedAdd') {
      return {
        required: ['doc.name'],
        enums: { 'doc.status': ['active', 'archived'] },
        rules: ['doc.name and doc.status must be supplied'],
      };
    }
    if (operation === 'customersCount') {
      return {
        purpose: 'Group tag or brand relationships',
        rules: ['not a contact-state count'],
      };
    }
    if (operation === 'salesBoards') {
      return {
        defaultResponseFields: ['_id', 'name'],
      };
    }
    return undefined;
  },
}));

import { buildErxesOperationTools } from '../operationTools';
import type { OperationMeta, OperationRegistry } from '../operationRegistry';
import type { GqlArgDef, GqlFieldDef, GqlTypeRef } from '../schemaIntrospect';

const scalar = (name: string): GqlTypeRef => ({ kind: 'SCALAR', name });
const enumType = (name: string): GqlTypeRef => ({ kind: 'ENUM', name });
const inputType = (name: string): GqlTypeRef => ({
  kind: 'INPUT_OBJECT',
  name,
});
const objectType = (name: string): GqlTypeRef => ({ kind: 'OBJECT', name });
const list = (ofType: GqlTypeRef): GqlTypeRef => ({ kind: 'LIST', ofType });
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
  objectFieldsMap: Record<string, GqlFieldDef[]> = {},
): OperationRegistry => ({
  operations: new Map(
    list.map((operation) => [operation.operation, operation]),
  ),
  list,
  inputTypesMap,
  enumValuesMap,
  objectFieldsMap,
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

const readSearchTerms = (description: string) => {
  const match = description.match(/Search terms: ([^.]+)\./);
  return match?.[1].split(' ') ?? [];
};

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

  it('keeps exact query terms without generic query verb pollution', () => {
    const getProject = makeOperation('getProject', [], 'query');
    getProject.plugin = 'operation';
    getProject.module = 'projects';
    const salesPipelines = makeOperation('salesPipelines', [], 'query');
    salesPipelines.module = 'pipelines';
    const tools = build(makeRegistry([getProject, salesPipelines]));
    const getProjectTerms = readSearchTerms(
      (tools.getProject as unknown as ToolLike).description,
    );
    const salesPipelineTerms = readSearchTerms(
      (tools.salesPipelines as unknown as ToolLike).description,
    );

    expect(getProjectTerms).toEqual(
      expect.arrayContaining([
        'getProject',
        'get',
        'project',
        'operation',
        'projects',
      ]),
    );
    expect(getProjectTerms).not.toEqual(
      expect.arrayContaining(['list', 'find', 'fetch', 'view', 'show']),
    );
    expect(salesPipelineTerms).toEqual(
      expect.arrayContaining([
        'salesPipelines',
        'sales',
        'pipelines',
        'pipeline',
      ]),
    );
    expect(salesPipelineTerms).not.toEqual(
      expect.arrayContaining([
        'list',
        'find',
        'get',
        'fetch',
        'search',
        'view',
        'show',
      ]),
    );
  });

  it('uses semantic guidance for an ambiguous operation name', () => {
    const operation = makeOperation('customersCount', [], 'query');
    const tool = build(makeRegistry([operation]))
      .customersCount as unknown as ToolLike;

    expect(tool.description).toContain('Group tag or brand relationships');
    expect(tool.description).toContain('not a contact-state count');
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

  it('uses bounded default response fields when none are requested', async () => {
    const operation = makeOperation('salesBoards', [], 'query');
    operation.returnType = list(objectType('SalesBoard'));
    const registry = makeRegistry(
      [operation],
      {},
      {},
      {
        SalesBoard: [
          { name: '_id', type: scalar('String') },
          { name: 'name', type: scalar('String') },
          { name: 'pipelines', type: list(objectType('SalesPipeline')) },
        ],
        SalesPipeline: [
          { name: '_id', type: scalar('String') },
          { name: 'name', type: scalar('String') },
          { name: 'itemsTotalCount', type: scalar('Int') },
        ],
      },
    );
    const tool = build(registry).salesBoards as unknown as ToolLike;

    await tool.execute({});

    expect(mockExecute).toHaveBeenCalledWith(
      operation,
      {},
      registry,
      undefined,
      ['_id', 'name'],
    );
    expect(tool.description).toContain('Default response fields: _id, name');
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
