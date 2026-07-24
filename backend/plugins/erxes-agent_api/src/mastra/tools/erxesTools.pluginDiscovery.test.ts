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

describe('fetchAvailableErxesTools plugin discovery', () => {
  beforeEach(() => {
    getPlugins.mockReset();
    getActivePlugins.mockReset();
    getPluginAddress.mockReset();
    jest.restoreAllMocks();
  });

  it('attributes operations using the gateway active-plugin list', async () => {
    getPlugins.mockResolvedValue(['core', 'erxes-agent']);
    getActivePlugins.mockResolvedValue(['core', 'frontline', 'erxes-agent']);
    getPluginAddress.mockImplementation(async (name: string) =>
      name === 'frontline' ? 'http://frontline' : `http://${name}`,
    );

    jest.spyOn(global, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url === 'http://frontline/graphql') {
        return jsonResponse({
          data: {
            __schema: {
              queryType: { fields: [{ name: 'conversations' }] },
              mutationType: { fields: [] },
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
                    name: 'conversations',
                    description: null,
                    args: [],
                    type: { name: 'ConversationListResponse', kind: 'OBJECT' },
                  },
                ],
              },
              mutationType: { fields: [] },
            },
          },
        });
      }
      return jsonResponse({
        data: {
          __schema: {
            queryType: { fields: [] },
            mutationType: { fields: [] },
          },
        },
      });
    });

    const tools = await fetchAvailableErxesTools({
      erxesApiUrl: 'http://gateway',
    });

    expect(tools).toEqual([
      expect.objectContaining({
        operation: 'conversations',
        plugin: 'frontline',
        pluginAttribution: 'subgraph',
      }),
    ]);
    expect(getPluginAddress).toHaveBeenCalledWith('frontline');
  });
});
