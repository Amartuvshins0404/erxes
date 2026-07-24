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

describe('deriveGrantAllowedTools', () => {
  it('forces a live registry refresh when access is saved', async () => {
    const settings = { erxesApiUrl: 'https://gateway.example.com' };
    const registry = { operations: new Map(), list: [] };
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

    getOperationRegistry.mockResolvedValue(registry);
    actionsToAllowedTools.mockReturnValue(['conversations']);

    const result = await deriveGrantAllowedTools(models, permissions);

    expect(getOperationRegistry).toHaveBeenCalledWith(settings, { force: true });
    expect(actionsToAllowedTools).toHaveBeenCalledWith(permissions, registry);
    expect(assertAllowedToolsInvariant).toHaveBeenCalledWith(
      ['conversations'],
      permissions,
      registry,
    );
    expect(result).toEqual(['conversations', 'builtin:calculator']);
  });
});
