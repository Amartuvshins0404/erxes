import { MongoClient } from 'mongodb';
import type {
  AnyBulkWriteOperation,
  Collection,
  Filter,
  ObjectId,
} from 'mongodb';
import { redis } from 'erxes-api-shared/utils';
import {
  type AgentProfilePermission,
  InvalidAgentProfilePermissionError,
  validateAgentProfilePermissions,
} from '~/modules/permissions/agentProfiles';

const ACTION_REPLACEMENTS: Record<string, readonly string[]> = {
  agentsView: ['erxesAgentAgentsReadSummary'],
  agentsChat: ['erxesAgentAgentsChat'],
  agentsCreate: ['erxesAgentAgentsCreate'],
  agentsEdit: ['erxesAgentAgentsUpdate', 'erxesAgentAgentsShare'],
  agentsRemove: ['erxesAgentAgentsRemove'],
  providersView: ['erxesAgentProvidersCatalogRead'],
  providersManage: ['erxesAgentProvidersManage'],
  providersRemove: ['erxesAgentProvidersRemove'],
  settingsView: ['erxesAgentSettingsStatusRead'],
  settingsManage: [
    'erxesAgentSettingsManage',
    'erxesAgentQuotasManage',
    'erxesAgentVoiceManage',
  ],
  workflowsView: ['erxesAgentWorkflowsRead'],
  workflowsCreate: ['erxesAgentWorkflowsCreateDraft'],
  workflowsEdit: ['erxesAgentWorkflowsUpdateDraft'],
  workflowsRemove: ['erxesAgentWorkflowsRemove'],
  workflowsRun: ['erxesAgentWorkflowsRun'],
  learningView: ['erxesAgentLearningRead'],
  learningCreate: ['erxesAgentLearningCurate'],
  learningEdit: ['erxesAgentLearningCurate'],
  learningRemove: ['erxesAgentLearningRemove'],
  skillsView: ['erxesAgentSkillsRead'],
  skillsCreate: ['erxesAgentSkillsCreate'],
  skillsEdit: ['erxesAgentSkillsUpdate', 'erxesAgentSkillsPublish'],
  skillsRemove: ['erxesAgentSkillsRemove'],
  skillsPromote: ['erxesAgentSkillsPromote', 'erxesAgentSkillsModerate'],
};

type PermissionEntry = {
  plugin?: string;
  module?: string;
  actions?: string[];
  scope?: string;
};

type PermissionContainer = {
  _id: ObjectId;
  name?: string;
  principalType?: 'human' | 'agent';
  permissions?: PermissionEntry[];
  customPermissions?: PermissionEntry[];
  role?: string;
  permissionGroupIds?: string[];
};

type AgentOwnership = {
  agentId?: string;
  createdBy?: string;
  ownerUserId?: string;
  visibility?: string;
  toolPolicy?: string;
  allowedTools?: string[];
};

type WorkflowOwnership = {
  _id: ObjectId;
  agentId?: string;
  createdByUserId?: string;
  isEnabled?: boolean;
  approvalStatus?: string;
};

const migrateEntries = (entries: PermissionEntry[] = []) =>
  entries.map((entry) => ({
    ...entry,
    actions: Array.from(
      new Set(
        (entry.actions ?? []).flatMap(
          (action) => ACTION_REPLACEMENTS[action] ?? [action],
        ),
      ),
    ),
  }));
const migrateCollection = async (
  collection: Collection<PermissionContainer>,
  field: 'permissions' | 'customPermissions',
  filter: Filter<PermissionContainer> = {},
) => {
  let operations: AnyBulkWriteOperation<PermissionContainer>[] = [];
  let modified = 0;

  const flush = async () => {
    if (!operations.length) return;
    const result = await collection.bulkWrite(operations, { ordered: false });
    modified += result.modifiedCount;
    operations = [];
  };

  const cursor = collection
    .find<PermissionContainer>(
      {
        [`${field}.actions`]: { $in: Object.keys(ACTION_REPLACEMENTS) },
        ...filter,
      },
      { projection: { _id: 1, [field]: 1 } },
    )
    .batchSize(200);

  for await (const document of cursor) {
    const entries = document[field] ?? [];
    operations.push({
      updateOne: {
        filter: { _id: document._id },
        update: { $set: { [field]: migrateEntries(entries) } },
      },
    });
    if (operations.length >= 200) await flush();
  }

  await flush();
  return modified;
};

const backfillWorkflowOwners = async (
  agents: Collection<AgentOwnership>,
  workflows: Collection<WorkflowOwnership>,
) => {
  const ownersByAgentId = new Map<string, string>();
  const agentCursor = agents
    .find(
      { agentId: { $type: 'string' } },
      { projection: { agentId: 1, createdBy: 1 } },
    )
    .batchSize(200);
  for await (const agent of agentCursor) {
    if (agent.agentId && agent.createdBy) {
      ownersByAgentId.set(agent.agentId, agent.createdBy);
    }
  }

  let operations: AnyBulkWriteOperation<WorkflowOwnership>[] = [];
  let modified = 0;
  const flush = async () => {
    if (!operations.length) return;
    const result = await workflows.bulkWrite(operations, { ordered: false });
    modified += result.modifiedCount;
    operations = [];
  };
  const workflowCursor = workflows
    .find(
      { createdByUserId: { $exists: false } },
      { projection: { _id: 1, agentId: 1 } },
    )
    .batchSize(200);
  for await (const workflow of workflowCursor) {
    const owner = workflow.agentId
      ? ownersByAgentId.get(workflow.agentId)
      : undefined;
    if (!owner) continue;
    operations.push({
      updateOne: {
        filter: { _id: workflow._id, createdByUserId: { $exists: false } },
        update: { $set: { createdByUserId: owner } },
      },
    });
    if (operations.length >= 200) await flush();
  }
  await flush();
  return modified;
};

const toAgentProfilePermissions = (
  entries: PermissionEntry[],
): AgentProfilePermission[] =>
  entries.map((entry) => {
    if (
      !entry.plugin ||
      !entry.module ||
      !entry.scope ||
      !['own', 'group', 'all'].includes(entry.scope)
    ) {
      throw new InvalidAgentProfilePermissionError(
        'Agent grant contains an invalid permission entry',
      );
    }

    return {
      plugin: entry.plugin,
      module: entry.module,
      actions: entry.actions ?? [],
      scope: entry.scope as AgentProfilePermission['scope'],
    };
  });

type AgentProfileMigrationPlan =
  | {
      groupId: ObjectId;
      permissions: AgentProfilePermission[];
      type: 'convert';
    }
  | {
      error: InvalidAgentProfilePermissionError;
      groupId: ObjectId;
      type: 'quarantine';
    };

const planAgentProfileMigrations = async (
  permissionGroups: Collection<PermissionContainer>,
): Promise<AgentProfileMigrationPlan[]> => {
  const plans: AgentProfileMigrationPlan[] = [];
  const cursor = permissionGroups.find(
    { name: /^agent-grant:/ },
    { projection: { _id: 1, permissions: 1 } },
  );

  for await (const group of cursor) {
    try {
      const permissions = toAgentProfilePermissions(
        migrateEntries(group.permissions),
      );
      await validateAgentProfilePermissions(permissions);
      plans.push({ groupId: group._id, permissions, type: 'convert' });
    } catch (error) {
      if (!(error instanceof InvalidAgentProfilePermissionError)) {
        throw error;
      }
      plans.push({ error, groupId: group._id, type: 'quarantine' });
    }
  }

  return plans;
};

const executeAgentProfileMigrations = async (
  permissionGroups: Collection<PermissionContainer>,
  users: Collection<PermissionContainer>,
  plans: AgentProfileMigrationPlan[],
) => {
  let converted = 0;
  let quarantined = 0;
  let serviceUsersUnassigned = 0;

  for (const plan of plans) {
    if (plan.type === 'convert') {
      const result = await permissionGroups.updateOne(
        { _id: plan.groupId },
        { $set: { principalType: 'agent', permissions: plan.permissions } },
      );
      converted += result.modifiedCount;
      continue;
    }

    const unassigned = await users.updateMany(
      {
        role: 'system',
        permissionGroupIds: String(plan.groupId),
      },
      { $pull: { permissionGroupIds: String(plan.groupId) } },
    );
    const result = await permissionGroups.updateOne(
      { _id: plan.groupId },
      { $set: { principalType: 'human' } },
    );
    quarantined += result.matchedCount;
    serviceUsersUnassigned += unassigned.modifiedCount;
    console.warn(
      `Quarantined unsafe agent grant ${String(plan.groupId)}: ${
        plan.error.message
      }; unassigned ${unassigned.modifiedCount} service users`,
    );
  }

  return { converted, quarantined, serviceUsersUnassigned };
};

const clearPermissionCaches = async () => {
  for (const pattern of ['user_actions_*', 'user_action_scopes_*']) {
    let cursor = 0;
    do {
      const [next, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        200,
      );
      cursor = Number(next);
      if (keys.length) await redis.del(...keys);
    } while (cursor !== 0);
  }
};

const command = async () => {
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error('Environment variable MONGO_URL is not set');

  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db();
    const permissionGroups =
      db.collection<PermissionContainer>('permission_groups');
    const users = db.collection<PermissionContainer>('users');
    const agents = db.collection<AgentOwnership>('mastra_agents');
    const workflows = db.collection<WorkflowOwnership>('mastra_workflows');

    const agentProfilePlans = await planAgentProfileMigrations(
      permissionGroups,
    );

    try {
      const [groupsModified, usersModified] = await Promise.all([
        migrateCollection(permissionGroups, 'permissions', {
          name: { $not: /^agent-grant:/ },
        }),
        migrateCollection(users, 'customPermissions'),
      ]);

      const agentProfiles = await executeAgentProfileMigrations(
        permissionGroups,
        users,
        agentProfilePlans,
      );
      const humanGroups = await permissionGroups.updateMany(
        { principalType: { $exists: false } },
        { $set: { principalType: 'human' } },
      );
      const agentAccessDefaults = await agents.updateMany(
        {
          $or: [
            { createdBy: { $exists: false } },
            { ownerUserId: { $exists: true } },
            { visibility: { $exists: false } },
            { toolPolicy: { $exists: true } },
            { allowedTools: { $exists: true } },
          ],
        },
        [
          {
            $set: {
              createdBy: { $ifNull: ['$createdBy', '$ownerUserId'] },
              visibility: { $ifNull: ['$visibility', 'private'] },
            },
          },
          { $unset: ['ownerUserId', 'toolPolicy', 'allowedTools'] },
        ],
      );
      const [approvedWorkflows, draftWorkflows, workflowOwners] =
        await Promise.all([
          workflows.updateMany(
            { isEnabled: true, approvalStatus: { $exists: false } },
            { $set: { approvalStatus: 'approved' } },
          ),
          workflows.updateMany(
            {
              isEnabled: { $ne: true },
              approvalStatus: { $exists: false },
            },
            { $set: { approvalStatus: 'draft' } },
          ),
          backfillWorkflowOwners(agents, workflows),
        ]);

      console.log(
        `Permission migration complete: ${groupsModified} groups, ${usersModified} users, ` +
          `${agentProfiles.converted} agent profiles, ${agentProfiles.quarantined} quarantined profiles, ${agentProfiles.serviceUsersUnassigned} service users unassigned, ${humanGroups.modifiedCount} human groups, ` +
          `${agentAccessDefaults.modifiedCount} agent access defaults, ` +
          `${approvedWorkflows.modifiedCount} approved workflows, ` +
          `${draftWorkflows.modifiedCount} draft workflows, ${workflowOwners} workflow owners`,
      );
    } finally {
      await clearPermissionCaches();
    }
  } finally {
    await client.close();
    redis.disconnect();
  }
};

command().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
