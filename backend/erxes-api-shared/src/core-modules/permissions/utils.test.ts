const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};
const mockGetActivePlugins = jest.fn();
const mockGetPlugin = jest.fn();
const mockSendTRPCMessage = jest.fn();

jest.mock('../../utils', () => ({
  redis: mockRedis,
  getActivePlugins: (...args: unknown[]) => mockGetActivePlugins(...args),
  getPlugin: (...args: unknown[]) => mockGetPlugin(...args),
  sendTRPCMessage: (...args: unknown[]) => mockSendTRPCMessage(...args),
  ExpectedError: class ExpectedError extends Error {},
}));

import type { IUserDocument } from '../../core-types';
import { canGroup, clearGroupActionsCache, getGroupActionScope } from './utils';

const user = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: 'user-1',
    permissionGroupIds: [],
    customPermissions: [],
    ...overrides,
  } as unknown as IUserDocument);

beforeEach(() => {
  jest.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.set.mockResolvedValue(undefined);
  mockRedis.del.mockResolvedValue(undefined);
  mockGetActivePlugins.mockResolvedValue(['operation']);
  mockGetPlugin.mockResolvedValue({ config: { meta: { permissions: {} } } });
  mockSendTRPCMessage.mockResolvedValue([]);
});

describe('effective permission actions', () => {
  it('unions default, custom-group, and per-user action grants', async () => {
    mockGetPlugin.mockResolvedValue({
      config: {
        meta: {
          permissions: {
            defaultGroups: [
              {
                id: 'operation:user',
                permissions: [
                  {
                    plugin: 'operation',
                    module: 'task',
                    actions: ['taskCreate'],
                    scope: 'own',
                  },
                ],
              },
            ],
          },
        },
      },
    });
    mockSendTRPCMessage.mockResolvedValue([
      {
        permissions: [
          {
            plugin: 'operation',
            module: 'task',
            actions: ['taskUpdate'],
            scope: 'group',
          },
        ],
      },
    ]);
    const member = user({
      permissionGroupIds: ['operation:user', 'custom-group'],
      customPermissions: [
        {
          plugin: 'operation',
          module: 'task',
          actions: ['taskRemove'],
          scope: 'all',
        },
      ],
    });

    await expect(canGroup('tenant', 'taskCreate', member)).resolves.toBe(true);
    await expect(canGroup('tenant', 'taskUpdate', member)).resolves.toBe(true);
    await expect(canGroup('tenant', 'taskRemove', member)).resolves.toBe(true);
    await expect(canGroup('tenant', 'projectRemove', member)).resolves.toBe(
      false,
    );
  });

  it('uses the broadest granted scope independently for each action', async () => {
    mockGetPlugin.mockResolvedValue({
      config: {
        meta: {
          permissions: {
            defaultGroups: [
              {
                id: 'operation:user',
                permissions: [
                  {
                    plugin: 'operation',
                    module: 'task',
                    actions: ['taskRead', 'taskUpdate'],
                    scope: 'own',
                  },
                  {
                    plugin: 'operation',
                    module: 'task',
                    actions: ['taskRead'],
                    scope: 'group',
                  },
                ],
              },
            ],
          },
        },
      },
    });
    const member = user({ permissionGroupIds: ['operation:user'] });

    await expect(
      getGroupActionScope('tenant', 'taskRead', member),
    ).resolves.toBe('group');
    await expect(
      getGroupActionScope('tenant', 'taskUpdate', member),
    ).resolves.toBe('own');
    await expect(
      getGroupActionScope('tenant', 'taskRemove', member),
    ).resolves.toBeNull();
  });

  it('gives organization owners all actions and all scope', async () => {
    const owner = user({ isOwner: true });

    await expect(canGroup('tenant', 'unknownAction', owner)).resolves.toBe(
      true,
    );
    await expect(
      getGroupActionScope('tenant', 'unknownAction', owner),
    ).resolves.toBe('all');
    expect(mockGetActivePlugins).not.toHaveBeenCalled();
  });
});

describe('permission cache invalidation', () => {
  it('clears action and action-scope caches together', async () => {
    await clearGroupActionsCache({ userId: 'user-1' });

    expect(mockRedis.del).toHaveBeenCalledWith(
      'user_actions_user-1',
      'user_action_scopes_user-1',
    );
  });
});
