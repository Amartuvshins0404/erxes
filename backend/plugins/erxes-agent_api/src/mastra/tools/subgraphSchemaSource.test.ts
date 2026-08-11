const getPlugins = jest.fn();
const getActivePlugins = jest.fn();
const getPluginAddress = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  getPlugins: (...args: unknown[]) => getPlugins(...args),
  getActivePlugins: (...args: unknown[]) => getActivePlugins(...args),
  getPluginAddress: (...args: unknown[]) => getPluginAddress(...args),
}));

import { buildSubgraphSchemaBundle } from './subgraphSchemaSource';
import { chooseResponseFields } from './schemaIntrospect';
import {
  getOperationRegistry,
  invalidateOperationRegistry,
} from './operationRegistry';

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
  });

const requestQuery = (init?: RequestInit): string => {
  const payload: unknown = JSON.parse(String(init?.body));
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('query' in payload) ||
    typeof payload.query !== 'string'
  ) {
    return '';
  }
  return payload.query;
};

const SALES_SDL = `
  scalar JSON
  enum DealSort { createdAtAsc createdAtDesc }
  input DealAddInput { name: String! productId: ID stageId: String }
  type Deal { _id: String! name: String amount: Float sort: DealSort }
  type DealListResponse { list: [Deal] totalCount: Int }
  extend type Query {
    """List deals"""
    deals(search: String, sort: DealSort, ids: [String!]!): DealListResponse
    _internalHealth: String
    cpDeals: Deal
  }
  extend type Mutation { dealsAdd(input: DealAddInput!): Deal }
`;

describe('buildSubgraphSchemaBundle', () => {
  it('derives operations, schema maps and type refs from SDL', () => {
    const bundle = buildSubgraphSchemaBundle(
      new Map([['sales', SALES_SDL]]),
    );

    // Internal (_*) and client-portal (cp*) operations are skipped,
    // Subscription roots are ignored, attribution is the owning subgraph.
    expect(bundle.operations.map((op) => op.operation)).toEqual([
      'deals',
      'dealsAdd',
    ]);

    const deals = bundle.operations.find((op) => op.operation === 'deals');
    expect(deals).toEqual(
      expect.objectContaining({
        operationType: 'query',
        plugin: 'sales',
        pluginAttribution: 'subgraph',
        description: 'List deals',
        returnType: { kind: 'OBJECT', name: 'DealListResponse' },
      }),
    );
    // Wrapper chains serialize back to exact GraphQL type strings.
    expect(deals?.graphqlArgs).toEqual([
      expect.objectContaining({
        name: 'search',
        type: { kind: 'SCALAR', name: 'String' },
      }),
      expect.objectContaining({
        name: 'sort',
        type: { kind: 'ENUM', name: 'DealSort' },
      }),
      expect.objectContaining({
        name: 'ids',
        type: {
          kind: 'NON_NULL',
          ofType: {
            kind: 'LIST',
            ofType: {
              kind: 'NON_NULL',
              ofType: { kind: 'SCALAR', name: 'String' },
            },
          },
        },
      }),
    ]);

    const dealsAdd = bundle.operations.find(
      (op) => op.operation === 'dealsAdd',
    );
    expect(dealsAdd?.operationType).toBe('mutation');
    expect(dealsAdd?.graphqlArgs?.[0]?.type).toEqual({
      kind: 'NON_NULL',
      ofType: { kind: 'INPUT_OBJECT', name: 'DealAddInput' },
    });

    expect(bundle.enumValuesMap.DealSort).toEqual([
      'createdAtAsc',
      'createdAtDesc',
    ]);
    expect(bundle.inputTypesMap.DealAddInput).toEqual([
      expect.objectContaining({
        name: 'name',
        type: {
          kind: 'NON_NULL',
          ofType: { kind: 'SCALAR', name: 'String' },
        },
      }),
      expect.objectContaining({ name: 'productId' }),
      expect.objectContaining({ name: 'stageId' }),
    ]);

    expect(bundle.objectFieldsMap.Deal.map((field) => field.name)).toEqual([
      '_id',
      'name',
      'amount',
      'sort',
    ]);
    // The SDL-derived object map drives a valid response selection,
    // including the ListResponse wrapper convention.
    expect(
      chooseResponseFields(deals?.returnType, bundle.objectFieldsMap),
    ).toContain('list {');
  });

  it('returns an empty bundle for no SDLs and skips unparseable SDLs', () => {
    expect(fetchSubgraphSchemaBundleNoSdls()).toEqual({
      operations: [],
      inputTypesMap: {},
      enumValuesMap: {},
      objectFieldsMap: {},
    });
    const bundle = buildSubgraphSchemaBundle(
      new Map([
        ['broken', 'type Query {{{'],
        ['sales', SALES_SDL],
      ]),
    );
    expect(bundle.operations).toHaveLength(2);
  });
});

const fetchSubgraphSchemaBundleNoSdls = () =>
  buildSubgraphSchemaBundle(new Map());

describe('operation registry — subgraph SDL fallback', () => {
  beforeEach(() => {
    getPlugins.mockReset();
    getActivePlugins.mockReset();
    getPluginAddress.mockReset();
    invalidateOperationRegistry();
    jest.restoreAllMocks();
  });

  it('builds the registry from subgraph SDL when the gateway /graphql is blocked', async () => {
    getPlugins.mockResolvedValue(['core']);
    getActivePlugins.mockResolvedValue(['core', 'sales']);
    getPluginAddress.mockImplementation(async (name: string) =>
      name === 'sales' ? 'http://sales' : `http://${name}`,
    );

    jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === 'http://gateway/graphql') {
        // The proxy in front of the gateway refuses the introspection POST.
        return jsonResponse({
          errors: [{ message: 'Method Not Allowed' }],
        });
      }
      if (url === 'http://sales/graphql') {
        expect(requestQuery(init)).toContain('_service');
        return jsonResponse({ data: { _service: { sdl: SALES_SDL } } });
      }
      return jsonResponse({ data: { _service: { sdl: '' } } });
    });

    const registry = await getOperationRegistry({
      erxesApiUrl: 'http://gateway',
    });

    expect(registry.list.map((op) => op.operation).sort()).toEqual([
      'deals',
      'dealsAdd',
    ]);
    expect(registry.operations.get('deals')).toEqual(
      expect.objectContaining({
        plugin: 'sales',
        pluginAttribution: 'subgraph',
      }),
    );
    // Schema maps came from the SDL too, not the blocked gateway.
    expect(registry.enumValuesMap.DealSort).toBeDefined();
    expect(registry.inputTypesMap.DealAddInput).toBeDefined();
    expect(registry.objectFieldsMap.Deal).toBeDefined();
  });
});
