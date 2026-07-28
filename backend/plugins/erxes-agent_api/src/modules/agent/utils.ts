import { FilterQuery } from 'mongoose';
import { PermissionScope } from 'erxes-api-shared/core-types';
import { IMastraAgentDocument } from '@/agent/@types/agent';
import { IModels } from '~/connectionResolvers';

/**
 * Single source of truth for whether an action scope reaches an agent.
 * `all` still respects private-user content: it reaches every shared agent plus
 * the caller's own private agents. Private access requires ownership.
 */
export const canUserAccessAgent = (
  agent: {
    createdBy?: string;
    visibility?: string | null;
    teamId?: string | null;
    departmentId?: string | null;
    unitId?: string | null;
  },
  userId: string,
  scope: PermissionScope,
  teamIds: string[] = [],
  deptIds: string[] = [],
  unitIds: string[] = [],
): boolean => {
  if (agent.createdBy === userId) return true;
  if (scope === 'own') return false;

  const visibility = agent.visibility ?? 'private';
  if (visibility === 'org') return true;
  if (scope === 'all') return visibility !== 'private';
  if (visibility === 'team') return teamIds.includes(agent.teamId ?? '');
  if (visibility === 'department') {
    return deptIds.includes(agent.departmentId ?? '');
  }
  if (visibility === 'unit') return unitIds.includes(agent.unitId ?? '');
  return false;
};

/**
 * Unit membership lives on the unit document (`userIds` array), not on the
 * user document. Units belong to the core erxes schema, not the agent plugin,
 * so we access them via the raw MongoDB Db object from the shared connection.
 * Best-effort: returns [] on any error so unit-scoped access degrades to
 * "no access" (same as an empty unitIds list) rather than crashing the turn.
 */
export async function getUserUnitIds(
  models: IModels,
  userId: string,
): Promise<string[]> {
  try {
    const db = (
      models.MastraAgent as unknown as { db: { db: import('mongodb').Db } }
    ).db.db;
    const docs = await db
      .collection('units')
      .find({ userIds: userId }, { projection: { _id: 1 } })
      .toArray();
    return docs.map((d: { _id: unknown }) => String(d._id));
  } catch {
    return [];
  }
}

/**
 * Parallel quota lookup: current agent count + per-user override + org default.
 * Shared by the quota-status query and the create mutation so the check is
 * always identical at both call sites.
 */
export async function getAgentQuotaStatus(
  models: IModels,
  userId: string,
): Promise<{ count: number; quota: number; atQuota: boolean }> {
  const [settings, userSettings, count] = await Promise.all([
    models.MastraSettings.getSettings(),
    models.MastraUserSettings.getUserSettings(userId),
    models.MastraAgent.countDocuments({ createdBy: userId }),
  ]);
  const quota = userSettings?.agentQuota ?? settings?.defaultAgentQuota ?? 0;
  return { count, quota, atQuota: quota > 0 && count >= quota };
}

/**
 * Mongo $or filter expressing the same logic as canUserAccessAgent.
 * branchIds → teamIds, departmentIds → deptIds, unit membership → unitIds.
 */
export const visibilityFilter = (
  userId: string,
  scope: PermissionScope,
  teamIds: string[] = [],
  deptIds: string[] = [],
  unitIds: string[] = [],
): FilterQuery<IMastraAgentDocument> => {
  if (scope === 'own') return { createdBy: userId };

  if (scope === 'all') {
    return {
      $or: [
        { createdBy: userId },
        { visibility: { $in: ['team', 'department', 'unit', 'org'] } },
      ],
    };
  }

  return {
    $or: [
      { createdBy: userId },
      { visibility: 'org' },
      ...(teamIds.length
        ? [{ visibility: 'team', teamId: { $in: teamIds } }]
        : []),
      ...(deptIds.length
        ? [{ visibility: 'department', departmentId: { $in: deptIds } }]
        : []),
      ...(unitIds.length
        ? [{ visibility: 'unit', unitId: { $in: unitIds } }]
        : []),
    ],
  };
};
