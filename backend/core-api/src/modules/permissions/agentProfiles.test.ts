const getPlugin = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  getPlugin: (...args: unknown[]) => getPlugin(...args),
}));

import {
  InvalidAgentProfilePermissionError,
  validateAgentProfilePermissions,
} from './agentProfiles';

const plugin = (module: string, action: Record<string, unknown>) => ({
  config: {
    meta: {
      permissions: {
        modules: [
          {
            name: module,
            scopes: [
              { name: 'own', description: 'Owned records' },
              { name: 'all', description: 'All records' },
            ],
            actions: [action],
          },
        ],
      },
    },
  },
});

describe('validateAgentProfilePermissions', () => {
  beforeEach(() => getPlugin.mockReset());

  it('accepts an explicitly agent-callable action', async () => {
    getPlugin.mockResolvedValue(
      plugin('task', {
        name: 'taskCreate',
        title: 'Create task',
        description: 'Create tasks',
        agentCallable: true,
      }),
    );

    await expect(
      validateAgentProfilePermissions([
        {
          plugin: 'operation',
          module: 'task',
          actions: ['taskCreate'],
          scope: 'own',
        },
      ]),
    ).resolves.toBeUndefined();
  });

  it('rejects scopes not declared by the permission module', async () => {
    getPlugin.mockResolvedValue(
      plugin('task', {
        name: 'taskCreate',
        title: 'Create task',
        description: 'Create tasks',
        agentCallable: true,
      }),
    );

    await expect(
      validateAgentProfilePermissions([
        {
          plugin: 'operation',
          module: 'task',
          actions: ['taskCreate'],
          scope: 'group',
        },
      ]),
    ).rejects.toThrow(/invalid permission scope/i);
  });

  it('treats an unavailable permission catalog as a migration failure', async () => {
    getPlugin.mockResolvedValue(undefined);

    await expect(
      validateAgentProfilePermissions([
        {
          plugin: 'operation',
          module: 'task',
          actions: ['taskCreate'],
          scope: 'own',
        },
      ]),
    ).rejects.not.toBeInstanceOf(InvalidAgentProfilePermissionError);
  });

  it('rejects sensitive settings modules even without an explicit flag', async () => {
    getPlugin.mockResolvedValue(
      plugin('settings', {
        name: 'settingsManage',
        title: 'Manage settings',
        description: 'Manage settings',
      }),
    );

    await expect(
      validateAgentProfilePermissions([
        {
          plugin: 'core',
          module: 'settings',
          actions: ['settingsManage'],
          scope: 'all',
        },
      ]),
    ).rejects.toThrow(/cannot be granted to an agent/i);
  });

  it('rejects a resolver action without explicit agent-callable metadata', async () => {
    getPlugin.mockResolvedValue(
      plugin('task', {
        name: 'taskCreate',
        title: 'Create task',
        description: 'Create tasks',
      }),
    );

    await expect(
      validateAgentProfilePermissions([
        {
          plugin: 'operation',
          module: 'task',
          actions: ['taskCreate'],
          scope: 'own',
        },
      ]),
    ).rejects.toThrow(/cannot be granted to an agent/i);
  });

  it('rejects custom actions unless explicitly marked agent-callable', async () => {
    getPlugin.mockResolvedValue(
      plugin('task', {
        name: 'taskExport',
        title: 'Export tasks',
        description: 'Export tasks',
        type: 'custom',
      }),
    );

    await expect(
      validateAgentProfilePermissions([
        {
          plugin: 'operation',
          module: 'task',
          actions: ['taskExport'],
          scope: 'all',
        },
      ]),
    ).rejects.toThrow(/cannot be granted to an agent/i);
  });
});
