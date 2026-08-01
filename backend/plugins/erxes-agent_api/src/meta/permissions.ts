import {
  IPermissionAction,
  IPermissionConfig,
  IPermissionGroupPermission,
  IPermissionModule,
  IPermissionScope,
  PermissionScope,
} from 'erxes-api-shared/core-types';
import { ERXES_AGENT_ACTIONS } from './permissionActions';

export const PLUGIN = 'erxes-agent';

const SCOPES: IPermissionScope[] = [
  { name: 'own', description: 'Records the user owns or created' },
  {
    name: 'group',
    description: 'Records available through their configured audience',
  },
  { name: 'all', description: 'All administrable records' },
];

const action = (
  name: string,
  title: string,
  description: string,
): IPermissionAction => ({
  name,
  title,
  description,
  agentCallable: false,
});

const permissionModule = (
  name: string,
  description: string,
  actions: IPermissionAction[],
  scopeField: string | null,
  ownerFields: string[],
): IPermissionModule => ({
  name,
  description,
  actions,
  scopeField,
  ownerFields,
  scopes: SCOPES,
});

const modules: IPermissionModule[] = [
  permissionModule(
    'agent',
    'AI agent configuration, sharing, moderation, and chat',
    [
      action(
        ERXES_AGENT_ACTIONS.agent.readSummary,
        'View agent summaries',
        'List safe metadata for agents available to the user',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.readConfig,
        'View agent configuration',
        'Read instructions, tool policy, and other sensitive agent configuration',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.chat,
        'Chat with agents',
        'Talk to an accessible agent and manage owned chat sessions',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.create,
        'Create agents',
        'Create a new private agent',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.update,
        'Update agent configuration',
        'Update ordinary configuration for an authorized agent',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.remove,
        'Remove agents',
        'Delete an authorized agent',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.share,
        'Share agents',
        'Change an agent audience to team, department, unit, or organization',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.moderate,
        'Moderate agents',
        'Disable or remove shared agents without opening private content',
      ),
      action(
        ERXES_AGENT_ACTIONS.agent.transferOwnership,
        'Transfer agent ownership',
        'Assign an agent execution owner to another team member',
      ),
    ],
    'visibility',
    ['createdBy'],
  ),
  permissionModule(
    'provider',
    'AI provider catalog and write-only credentials',
    [
      action(
        ERXES_AGENT_ACTIONS.provider.catalogRead,
        'View provider catalog',
        'List provider names and live models without stored configuration',
      ),
      action(
        ERXES_AGENT_ACTIONS.provider.configRead,
        'View provider configuration',
        'Read configured providers with credentials masked',
      ),
      action(
        ERXES_AGENT_ACTIONS.provider.manage,
        'Manage providers',
        'Create or update provider configuration and write-only credentials',
      ),
      action(
        ERXES_AGENT_ACTIONS.provider.remove,
        'Remove providers',
        'Delete provider configuration',
      ),
    ],
    'scope',
    ['ownerId'],
  ),
  permissionModule(
    'settings',
    'Agent plugin status, settings, and quotas',
    [
      action(
        ERXES_AGENT_ACTIONS.settings.statusRead,
        'View feature status',
        'Read secret-free attachment and feature status',
      ),
      action(
        ERXES_AGENT_ACTIONS.settings.manage,
        'Manage settings',
        'Update plugin-wide settings',
      ),
      action(
        ERXES_AGENT_ACTIONS.settings.quotasManage,
        'Manage agent quotas',
        'Set organization and per-user agent quotas',
      ),
    ],
    null,
    [],
  ),
  permissionModule(
    'workflow',
    'Workflow drafts, approvals, schedules, execution, and run history',
    [
      action(
        ERXES_AGENT_ACTIONS.workflow.read,
        'View workflows',
        'Read workflows belonging to accessible agents',
      ),
      action(
        ERXES_AGENT_ACTIONS.workflow.createDraft,
        'Create workflow drafts',
        'Create a disabled draft for an authorized agent',
      ),
      action(
        ERXES_AGENT_ACTIONS.workflow.updateDraft,
        'Update workflow drafts',
        'Edit a workflow definition and return it to draft state',
      ),
      action(
        ERXES_AGENT_ACTIONS.workflow.remove,
        'Remove workflows',
        'Delete an authorized workflow',
      ),
      action(
        ERXES_AGENT_ACTIONS.workflow.run,
        'Run workflows',
        'Manually execute an approved workflow as the requesting user',
      ),
      action(
        ERXES_AGENT_ACTIONS.workflow.approve,
        'Approve workflows',
        'Approve a workflow definition for execution',
      ),
      action(
        ERXES_AGENT_ACTIONS.workflow.schedule,
        'Manage workflow schedules',
        'Enable or disable approved background workflows',
      ),
      action(
        ERXES_AGENT_ACTIONS.workflow.runsRead,
        'View workflow runs',
        'Read authorized workflow run status and redacted output',
      ),
    ],
    'agentId',
    ['createdByUserId'],
  ),
  permissionModule(
    'learning',
    'Published agent knowledge and administrative curation',
    [
      action(
        ERXES_AGENT_ACTIONS.learning.read,
        'View published learnings',
        'Read approved learnings belonging to accessible agents',
      ),
      action(
        ERXES_AGENT_ACTIONS.learning.curate,
        'Curate learnings',
        'Create, edit, review, re-status, or pin learning statements',
      ),
      action(
        ERXES_AGENT_ACTIONS.learning.remove,
        'Remove learnings',
        'Delete learning statements',
      ),
    ],
    'agentId',
    ['createdBy'],
  ),
  permissionModule(
    'skills',
    'Private and published reusable agent skills',
    [
      action(
        ERXES_AGENT_ACTIONS.skills.read,
        'View skills',
        'Read owned skills and published global skills',
      ),
      action(
        ERXES_AGENT_ACTIONS.skills.create,
        'Create skills',
        'Create a private skill',
      ),
      action(
        ERXES_AGENT_ACTIONS.skills.update,
        'Update skills',
        'Edit an owned skill',
      ),
      action(
        ERXES_AGENT_ACTIONS.skills.publish,
        'Publish skills',
        'Publish or restore a version of an owned private skill',
      ),
      action(
        ERXES_AGENT_ACTIONS.skills.remove,
        'Remove skills',
        'Delete an owned private skill',
      ),
      action(
        ERXES_AGENT_ACTIONS.skills.promote,
        'Promote skills',
        'Promote an owned published skill to global visibility',
      ),
      action(
        ERXES_AGENT_ACTIONS.skills.moderate,
        'Moderate global skills',
        'Demote or remove global skills',
      ),
    ],
    null,
    ['authorId'],
  ),
];

const grant = (
  moduleName: string,
  actions: string[],
  scope: PermissionScope,
): IPermissionGroupPermission => ({
  plugin: PLUGIN,
  module: moduleName,
  actions,
  scope,
});

const allActions = (moduleName: string) =>
  modules
    .find((permissionModule) => permissionModule.name === moduleName)
    ?.actions.map((permissionAction) => permissionAction.name) ?? [];

const ADMIN_AGENT_ACTIONS = allActions('agent').filter(
  (actionName) => actionName !== ERXES_AGENT_ACTIONS.agent.transferOwnership,
);

export const permissions: IPermissionConfig = {
  plugin: PLUGIN,
  modules,
  defaultGroups: [
    {
      id: `${PLUGIN}:viewer`,
      name: 'Agent Viewer',
      description: 'Safe read-only access to shared agent resources',
      principalType: 'human',
      permissions: [
        grant('agent', [ERXES_AGENT_ACTIONS.agent.readSummary], 'group'),
        grant('settings', [ERXES_AGENT_ACTIONS.settings.statusRead], 'group'),
      ],
    },
    {
      id: `${PLUGIN}:user`,
      name: 'Agent User',
      description:
        'Chat with shared agents and manage owned private agents, workflow drafts, and skills',
      principalType: 'human',
      permissions: [
        grant(
          'agent',
          [
            ERXES_AGENT_ACTIONS.agent.readSummary,
            ERXES_AGENT_ACTIONS.agent.chat,
          ],
          'group',
        ),
        grant('agent', [ERXES_AGENT_ACTIONS.agent.readConfig], 'own'),
        grant(
          'agent',
          [
            ERXES_AGENT_ACTIONS.agent.create,
            ERXES_AGENT_ACTIONS.agent.update,
            ERXES_AGENT_ACTIONS.agent.remove,
            ERXES_AGENT_ACTIONS.agent.share,
          ],
          'own',
        ),
        grant('provider', [ERXES_AGENT_ACTIONS.provider.catalogRead], 'group'),
        grant(
          'provider',
          [
            ERXES_AGENT_ACTIONS.provider.configRead,
            ERXES_AGENT_ACTIONS.provider.manage,
            ERXES_AGENT_ACTIONS.provider.remove,
          ],
          'own',
        ),
        grant('settings', [ERXES_AGENT_ACTIONS.settings.statusRead], 'group'),
        grant(
          'workflow',
          [
            ERXES_AGENT_ACTIONS.workflow.read,
            ERXES_AGENT_ACTIONS.workflow.createDraft,
            ERXES_AGENT_ACTIONS.workflow.updateDraft,
            ERXES_AGENT_ACTIONS.workflow.remove,
            ERXES_AGENT_ACTIONS.workflow.run,
            ERXES_AGENT_ACTIONS.workflow.runsRead,
          ],
          'own',
        ),
        grant('skills', [ERXES_AGENT_ACTIONS.skills.read], 'group'),
        grant(
          'skills',
          [
            ERXES_AGENT_ACTIONS.skills.create,
            ERXES_AGENT_ACTIONS.skills.update,
            ERXES_AGENT_ACTIONS.skills.publish,
            ERXES_AGENT_ACTIONS.skills.remove,
          ],
          'own',
        ),
      ],
    },
    {
      id: `${PLUGIN}:admin`,
      name: 'Agent Admin',
      description:
        'Manage all agents, providers, settings, workflows, learnings, skills, and agent grant profiles',
      principalType: 'human',
      permissions: [
        grant('agent', ADMIN_AGENT_ACTIONS, 'all'),
        grant('provider', allActions('provider'), 'all'),
        grant('settings', allActions('settings'), 'all'),
        grant('workflow', allActions('workflow'), 'all'),
        grant('learning', allActions('learning'), 'all'),
        grant('skills', allActions('skills'), 'all'),
        {
          plugin: 'core',
          module: 'permissions',
          actions: ['permissionsAgentProfilesManage'],
          scope: 'all',
        },
      ],
    },
  ],
};
