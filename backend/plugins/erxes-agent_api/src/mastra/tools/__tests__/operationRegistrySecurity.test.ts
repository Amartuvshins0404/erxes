/**
 * The operation registry is the single source every discovery surface (search,
 * capability inventory, workflow step resolution, the tool-listing UI) reads
 * from. Security-blocked operations must be stripped here so none of those
 * surfaces can reveal or resolve them. Network introspection is mocked.
 */
jest.mock('../erxesTools', () => ({
  fetchAvailableErxesTools: jest.fn(),
  fetchInputSchemaMaps: jest.fn(),
  fetchObjectFieldsMap: jest.fn(),
}));

import {
  getOperationRegistry,
  invalidateOperationRegistry,
} from '../operationRegistry';
import * as erxesTools from '../erxesTools';
import type { OperationMeta } from '../operationRegistry';

const asMock = (fn: unknown) => fn as jest.Mock;

const meta = (
  operation: string,
  pluginAttribution?: OperationMeta['pluginAttribution'],
  plugin = 'core',
): OperationMeta =>
  ({
    operation,
    operationType: 'query',
    plugin,
    module: 'settings',
    description: '',
    graphqlArgs: [],
    pluginAttribution,
  } as OperationMeta);

describe('getOperationRegistry — security strip', () => {
  beforeEach(() => {
    invalidateOperationRegistry();
    asMock(erxesTools.fetchInputSchemaMaps).mockResolvedValue({
      inputTypesMap: {},
      enumValuesMap: {},
    });
    asMock(erxesTools.fetchObjectFieldsMap).mockResolvedValue({});
  });

  it('preserves a better-attributed registry after a partial forced refresh', async () => {
    const settings = {
      erxesApiUrl: 'http://test',
    };
    asMock(erxesTools.fetchAvailableErxesTools)
      .mockResolvedValueOnce([meta('conversations', 'subgraph', 'frontline')])
      .mockResolvedValueOnce([
        meta('conversations', 'fallback', 'conversations'),
        meta('automations', 'subgraph', 'core'),
      ]);

    const current = await getOperationRegistry(settings);
    const refreshed = await getOperationRegistry(settings, { force: true });
    const cached = await getOperationRegistry(settings);

    expect(refreshed).not.toBe(current);
    expect(cached).toBe(refreshed);
    expect(cached.list).toEqual([
      expect.objectContaining({
        operation: 'conversations',
        plugin: 'frontline',
        pluginAttribution: 'subgraph',
      }),
      expect.objectContaining({
        operation: 'automations',
        plugin: 'core',
        pluginAttribution: 'subgraph',
      }),
    ]);
  });

  it('strips security-blocked ops from both the list and the name map', async () => {
    asMock(erxesTools.fetchAvailableErxesTools).mockResolvedValue([
      meta('customers'),
      meta('configs'),
      meta('configsByCode'),
      meta('configsGetValue'),
      meta('configsGetEnv'),
    ]);

    const reg = await getOperationRegistry({
      erxesApiUrl: 'http://test',
    });

    // Only the legitimate op survives — the config-store reads are gone, so
    // search and every other registry consumer can never surface them.
    expect(reg.list.map((o) => o.operation)).toEqual(['customers']);
    expect(reg.operations.has('customers')).toBe(true);
    for (const blocked of [
      'configs',
      'configsByCode',
      'configsGetValue',
      'configsGetEnv',
    ]) {
      expect(reg.operations.has(blocked)).toBe(false);
    }
  });
});
