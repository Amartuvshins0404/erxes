const getOperationRegistry = jest.fn();
const actionsToAllowedTools = jest.fn();
const assertAllowedToolsInvariant = jest.fn();

jest.mock('~/mastra/tools/operationRegistry', () => ({
  getOperationRegistry: (...args: unknown[]) => getOperationRegistry(...args),
}));

jest.mock('~/mastra/tools/actionsToAllowedTools', () => ({
  actionsToAllowedTools: (...args: unknown[]) =>
    actionsToAllowedTools(...args),
  assertAllowedToolsInvariant: (...args: unknown[]) =>
    assertAllowedToolsInvariant(...args),
}));

jest.mock('~/mastra/tools/builtins', () => ({
  BUILTIN_TOOLS: { calculator: {} },
}));

import { deriveGrantAllowedTools } from './grantTools';

const settings = { erxesApiUrl: 'https://gateway.example.com' };
const permissions = [
  {
    plugin: 'frontline',
    module: 'inbox',
    actions: ['showConversations'],
  },
];
const models = {
  MastraSettings: {
    getSettings: jest.fn().mockResolvedValue(settings),
  },
};

describe('deriveGrantAllowedTools', () => {
  beforeEach(() => {
    getOperationRegistry.mockReset();
    actionsToAllowedTools.mockReset();
    assertAllowedToolsInvariant.mockReset();
  });

  it('forces a live registry refresh when access is saved', async () => {
    const registry = { operations: new Map(), list: [] };

    getOperationRegistry.mockResolvedValue(registry);
    actionsToAllowedTools.mockReturnValue(['conversations']);

    const result = await deriveGrantAllowedTools(models, permissions);

    expect(getOperationRegistry).toHaveBeenNthCalledWith(1, settings);
    expect(getOperationRegistry).toHaveBeenNthCalledWith(2, settings, {
      force: true,
    });
    expect(result).toEqual(['conversations', 'builtin:calculator']);
  });

  it('preserves current grant tools when a refresh is incomplete', async () => {
    const currentRegistry = { operations: new Map(), list: ['current'] };
    const refreshedRegistry = { operations: new Map(), list: ['refreshed'] };

    getOperationRegistry
      .mockResolvedValueOnce(currentRegistry)
      .mockResolvedValueOnce(refreshedRegistry);
    actionsToAllowedTools
      .mockReturnValueOnce(['conversations'])
      .mockReturnValueOnce([]);

    const result = await deriveGrantAllowedTools(models, permissions);

    expect(assertAllowedToolsInvariant).toHaveBeenNthCalledWith(
      1,
      ['conversations'],
      permissions,
      currentRegistry,
    );
    expect(assertAllowedToolsInvariant).toHaveBeenNthCalledWith(
      2,
      [],
      permissions,
      refreshedRegistry,
    );
    expect(result).toEqual(['conversations', 'builtin:calculator']);
  });
});
