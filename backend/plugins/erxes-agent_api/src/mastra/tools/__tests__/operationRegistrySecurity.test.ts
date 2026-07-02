/**
 * The operation registry is the single source every discovery surface (search,
 * capability inventory, workflow step resolution, the tool-listing UI) reads
 * from. Security-blocked operations must be stripped here so none of those
 * surfaces can reveal or resolve them. Network introspection is mocked.
 */
jest.mock('../erxesTools', () => ({
  fetchAvailableErxesTools: jest.fn(),
  fetchInputTypesMap: jest.fn(),
  fetchObjectFieldsMap: jest.fn(),
}));

import {
  getOperationRegistry,
  invalidateOperationRegistry,
} from '../operationRegistry';
import * as erxesTools from '../erxesTools';
import type { OperationMeta } from '../operationRegistry';

const asMock = (fn: unknown) => fn as jest.Mock;

const meta = (operation: string): OperationMeta =>
  ({
    operation,
    operationType: 'query',
    plugin: 'core',
    module: 'settings',
    description: '',
    graphqlArgs: [],
  }) as OperationMeta;

describe('getOperationRegistry — security strip', () => {
  beforeEach(() => {
    invalidateOperationRegistry();
    asMock(erxesTools.fetchInputTypesMap).mockResolvedValue({});
    asMock(erxesTools.fetchObjectFieldsMap).mockResolvedValue({});
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
      erxesApiToken: 'security-strip',
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
