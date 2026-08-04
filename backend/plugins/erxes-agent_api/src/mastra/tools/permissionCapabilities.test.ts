const sendTRPCMessage = jest.fn();
const getPlugins = jest.fn();
const getPlugin = jest.fn();
const actionsToAllowedTools = jest.fn();
const assertAllowedToolsInvariant = jest.fn();

jest.mock('erxes-api-shared/utils', () => ({
  sendTRPCMessage: (...args: unknown[]) => sendTRPCMessage(...args),
  getPlugins: (...args: unknown[]) => getPlugins(...args),
  getPlugin: (...args: unknown[]) => getPlugin(...args),
}));
jest.mock('./builtins', () => ({
  BUILTIN_TOOLS: {
    calculator: {},
    generatePdf: {},
    webSearch: {},
    fetchUrl: {},
    workflowGuide: {},
    workflowValidate: {},
    workflowSimulate: {},
    workflowSave: {},
    workflowUpdate: {},
    workflowList: {},
    workflowRuns: {},
    workflowRunNow: {},
    make_skill: {},
  },
}));
jest.mock('./actionsToAllowedTools', () => ({
  actionsToAllowedTools: (...args: unknown[]) => actionsToAllowedTools(...args),
  assertAllowedToolsInvariant: (...args: unknown[]) =>
    assertAllowedToolsInvariant(...args),
}));

import {
  deriveAgentAllowedTools,
  resolveAgentAllowedTools,
  resolveAgentPermissions,
} from './permissionCapabilities';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

const registry = { operations: new Map(), list: [] };

beforeEach(() => {
  sendTRPCMessage.mockReset().mockResolvedValue([]);
  getPlugins.mockReset().mockResolvedValue([]);
  getPlugin.mockReset();
  actionsToAllowedTools.mockReset().mockReturnValue(['dealsView']);
  assertAllowedToolsInvariant.mockReset();
});

describe('permission-derived agent capabilities', () => {
  it('maps permission actions to erxes operations and privileged builtins', () => {
    const permissions = [
      {
        plugin: 'erxes-agent',
        module: 'workflow',
        actions: [
          ERXES_AGENT_ACTIONS.workflow.read,
          ERXES_AGENT_ACTIONS.workflow.createDraft,
          ERXES_AGENT_ACTIONS.skills.create,
        ],
      },
    ];

    const result = deriveAgentAllowedTools(permissions, registry);

    expect(actionsToAllowedTools).toHaveBeenCalledWith(permissions, registry);
    expect(assertAllowedToolsInvariant).toHaveBeenCalledWith(
      ['dealsView'],
      permissions,
      registry,
    );
    expect(result).toEqual(
      expect.arrayContaining([
        'dealsView',
        'builtin:calculator',
        'builtin:generatePdf',
        'builtin:workflowGuide',
        'builtin:workflowValidate',
        'builtin:workflowSimulate',
        'builtin:workflowList',
        'builtin:workflowSave',
        'builtin:make_skill',
      ]),
    );
    expect(result).not.toContain('builtin:webSearch');
    expect(result).not.toContain('builtin:fetchUrl');
    expect(result).not.toContain('builtin:workflowUpdate');
    expect(result).not.toContain('builtin:workflowRunNow');
  });

  it('adds only the optional tools explicitly selected for an agent', () => {
    const result = deriveAgentAllowedTools([], registry, [
      'webSearch',
      'terminal',
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        'dealsView',
        'builtin:webSearch',
        'builtin:terminal',
      ]),
    );
    expect(result).not.toContain('builtin:calculator');
    expect(result).not.toContain('builtin:generatePdf');
    expect(result).not.toContain('builtin:fetchUrl');
  });

  it('gates workflow run history separately from workflow definitions', () => {
    const permissions = [
      {
        plugin: 'erxes-agent',
        module: 'workflow',
        actions: [ERXES_AGENT_ACTIONS.workflow.runsRead],
      },
    ];

    const result = deriveAgentAllowedTools(permissions, registry);

    expect(result).toContain('builtin:workflowRuns');
    expect(result).not.toContain('builtin:workflowList');
    expect(result).not.toContain('builtin:workflowRunNow');
  });

  it('loads every selected custom group in one query and merges actions and scope', async () => {
    sendTRPCMessage.mockResolvedValue([
      {
        _id: 'group-1',
        permissions: [
          {
            plugin: 'sales',
            module: 'deal',
            actions: ['dealsView'],
            scope: 'own',
          },
        ],
      },
      {
        _id: 'group-2',
        permissions: [
          {
            plugin: 'sales',
            module: 'deal',
            actions: ['dealsEdit'],
            scope: 'all',
          },
        ],
      },
    ]);

    const result = await resolveAgentPermissions({
      subdomain: 'os',
      permissionGroupIds: ['group-1', 'group-2', 'group-1'],
      customPermissions: [
        {
          plugin: 'sales',
          module: 'deal',
          actions: ['dealsRemove'],
          scope: 'group',
        },
      ],
    });

    expect(sendTRPCMessage).toHaveBeenCalledTimes(1);
    expect(sendTRPCMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        subdomain: 'os',
        pluginName: 'core',
        module: 'permissionGroups',
        action: 'find',
        input: { query: { _id: { $in: ['group-1', 'group-2'] } } },
      }),
    );
    expect(result).toEqual({
      permissions: [
        {
          plugin: 'sales',
          module: 'deal',
          actions: ['dealsView', 'dealsEdit', 'dealsRemove'],
          scope: 'all',
        },
      ],
      foundGroupIds: ['group-1', 'group-2'],
    });
  });

  it('resolves built-in and custom groups together from their owning registries', async () => {
    getPlugins.mockResolvedValue(['sales']);
    getPlugin.mockResolvedValue({
      config: {
        meta: {
          permissions: {
            defaultGroups: [
              {
                id: 'sales:viewer',
                permissions: [
                  { module: 'deal', actions: ['dealsView'], scope: 'all' },
                ],
              },
            ],
          },
        },
      },
    });
    sendTRPCMessage.mockResolvedValue([
      {
        _id: 'group-custom',
        permissions: [
          { plugin: 'sales', module: 'deal', actions: ['dealsEdit'] },
        ],
      },
    ]);

    const result = await resolveAgentPermissions({
      subdomain: 'os',
      permissionGroupIds: ['sales:viewer', 'group-custom', 'deleted-group'],
    });

    expect(result).toEqual({
      permissions: [
        {
          plugin: 'sales',
          module: 'deal',
          actions: ['dealsView', 'dealsEdit'],
          scope: 'all',
        },
      ],
      foundGroupIds: ['sales:viewer', 'group-custom'],
    });
  });

  it('derives capabilities from custom account permissions without selected groups', async () => {
    const customPermissions = [
      { plugin: 'sales', module: 'deal', actions: ['dealsView'] },
    ];

    const result = await resolveAgentAllowedTools({
      subdomain: 'os',
      permissionGroupIds: [],
      customPermissions,
      registry,
    });

    expect(actionsToAllowedTools).toHaveBeenCalledWith(
      customPermissions,
      registry,
    );
    expect(result).toContain('dealsView');
    expect(sendTRPCMessage).not.toHaveBeenCalled();
  });
});
