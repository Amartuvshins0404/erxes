import { resolveAgentActionScope } from './agentActionScope';

describe('resolveAgentActionScope', () => {
  it('uses the host action-scope resolver when available', () => {
    const getActionScope = jest.fn((): 'all' => 'all');

    expect(
      resolveAgentActionScope(
        {
          getActionScope,
          isWildcard: false,
          permissions: [],
        },
        'agentsShare',
      ),
    ).toBe('all');
    expect(getActionScope).toHaveBeenCalledWith('agentsShare');
  });

  it('derives action scope from legacy host permissions', () => {
    expect(
      resolveAgentActionScope(
        {
          isWildcard: false,
          permissions: [
            {
              plugin: 'erxes-agent',
              module: 'agent',
              actions: ['agentsShare'],
              scope: 'own',
              actionScopes: { agentsShare: 'group' },
            },
          ],
        },
        'agentsShare',
      ),
    ).toBe('group');
  });

  it('falls back to the legacy module scope when action scopes are absent', () => {
    expect(
      resolveAgentActionScope(
        {
          isWildcard: false,
          permissions: [
            {
              plugin: 'erxes-agent',
              module: 'agent',
              actions: ['agentsShare'],
              scope: 'group',
              actionScopes: {},
            },
          ],
        },
        'agentsShare',
      ),
    ).toBe('group');
  });

  it('preserves wildcard and missing-permission behavior', () => {
    expect(
      resolveAgentActionScope(
        { isWildcard: true, permissions: null },
        'agentsShare',
      ),
    ).toBe('all');
    expect(
      resolveAgentActionScope(
        { isWildcard: false, permissions: [] },
        'agentsShare',
      ),
    ).toBeNull();
  });
});
