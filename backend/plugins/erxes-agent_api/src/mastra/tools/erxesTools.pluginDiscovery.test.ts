const getPlugins = jest.fn();
const getActivePlugins = jest.fn();
const getPluginAddress = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  getPlugins: (...args: unknown[]) => getPlugins(...args),
  getActivePlugins: (...args: unknown[]) => getActivePlugins(...args),
  getPluginAddress: (...args: unknown[]) => getPluginAddress(...args),
}));

import { fetchAvailableErxesTools } from './erxesTools';

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

describe('fetchAvailableErxesTools plugin discovery', () => {
  beforeEach(() => {
    getPlugins.mockReset();
    getActivePlugins.mockReset();
    getPluginAddress.mockReset();
    jest.restoreAllMocks();
  });

  it('attributes sales operations from federation SDL when introspection is disabled', async () => {
    getPlugins.mockResolvedValue(['core', 'erxes-agent']);
    getActivePlugins.mockResolvedValue(['core', 'sales', 'erxes-agent']);
    getPluginAddress.mockImplementation(async (name: string) =>
      name === 'sales' ? 'http://sales' : `http://${name}`,
    );

    jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      expect(new Headers(init?.headers).has('Authorization')).toBe(false);
      const url = String(input);
      if (url === 'http://sales/graphql') {
        const query = requestQuery(init);
        if (query.includes('__schema')) {
          return jsonResponse({
            errors: [{ extensions: { code: 'INTROSPECTION_DISABLED' } }],
          });
        }
        return jsonResponse({
          data: {
            _service: {
              sdl: `
                type Query { deals: [Deal] }
                extend type Mutation { dealsAdd: Deal }
              `,
            },
          },
        });
      }
      if (url === 'http://gateway/graphql') {
        return jsonResponse({
          data: {
            __schema: {
              queryType: {
                fields: [
                  {
                    name: 'deals',
                    description: null,
                    args: [],
                    type: { name: 'DealListResponse', kind: 'OBJECT' },
                  },
                ],
              },
              mutationType: {
                fields: [
                  {
                    name: 'dealsAdd',
                    description: null,
                    args: [],
                    type: { name: 'Deal', kind: 'OBJECT' },
                  },
                ],
              },
            },
          },
        });
      }
      return jsonResponse({ data: { _service: { sdl: '' } } });
    });

    const tools = await fetchAvailableErxesTools({
      erxesApiUrl: 'http://gateway',
    });

    expect(tools).toEqual([
      expect.objectContaining({
        operation: 'deals',
        plugin: 'sales',
        pluginAttribution: 'subgraph',
      }),
      expect.objectContaining({
        operation: 'dealsAdd',
        plugin: 'sales',
        pluginAttribution: 'subgraph',
      }),
    ]);
    expect(getPluginAddress).toHaveBeenCalledWith('sales');
  });
});
