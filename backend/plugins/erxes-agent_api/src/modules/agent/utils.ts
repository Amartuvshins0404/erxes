import { FilterQuery } from 'mongoose';
import { IUserDocument } from 'erxes-api-shared/core-types';
import { IMastraAgentDocument } from '@/agent/@types/agent';
import { AGENT_ADMIN_GROUP_ID } from '~/meta/permissions';
import { IModels } from '~/connectionResolvers';

/** True when the user holds owner or agent-admin role. */
export const isAgentAdmin = (user: IUserDocument) =>
  Boolean(
    user?.isOwner ||
      (user?.permissionGroupIds ?? []).includes(AGENT_ADMIN_GROUP_ID),
  );

/**
 * Single source of truth for "can user X read agent Y".
 * Private agents are visible only to their creator — even admins cannot see another
 * user's private agent. Admins can read all shared (team/department/org) agents
 * regardless of team membership. Admin write capability (edit/remove any agent)
 * is enforced separately in mutations by omitting the createdBy ownership filter.
 */
export const canUserAccessAgent = (
  agent: {
    createdBy?: string;
    visibility?: string;
    teamId?: string;
    departmentId?: string;
    unitId?: string;
  },
  userId: string,
  isAdmin: boolean,
  teamIds: string[] = [],
  deptIds: string[] = [],
  unitIds: string[] = [],
): boolean => {
  if (agent.createdBy === userId) return true;
  const vis = agent.visibility ?? 'private';
  if (vis === 'org') return true;
  if (isAdmin) return vis !== 'private'; // admin reads all shared agents
  if (vis === 'team') return teamIds.includes(agent.teamId ?? '');
  if (vis === 'department') return deptIds.includes(agent.departmentId ?? '');
  if (vis === 'unit') return unitIds.includes(agent.unitId ?? '');
  return false;
};

/**
 * Unit membership lives on the unit document (`userIds` array), not on the
 * user document. Units belong to the core erxes schema, not the agent plugin,
 * so we access them via the raw MongoDB Db object from the shared connection.
 * Best-effort: returns [] on any error so unit-scoped access degrades to
 * "no access" (same as an empty unitIds list) rather than crashing the turn.
 */
export async function getUserUnitIds(models: IModels, userId: string): Promise<string[]> {
  try {
    const db = (models.MastraAgent as any).db.db as import('mongodb').Db;
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
  isAdmin: boolean,
  teamIds: string[] = [],
  deptIds: string[] = [],
  unitIds: string[] = [],
): FilterQuery<IMastraAgentDocument> =>
  isAdmin
    ? { $or: [{ createdBy: userId }, { visibility: { $in: ['team', 'department', 'unit', 'org'] } }] }
    : {
        $or: [
          { createdBy: userId },
          { visibility: 'org' },
          ...(teamIds.length ? [{ visibility: 'team', teamId: { $in: teamIds } }] : []),
          ...(deptIds.length ? [{ visibility: 'department', departmentId: { $in: deptIds } }] : []),
          ...(unitIds.length ? [{ visibility: 'unit', unitId: { $in: unitIds } }] : []),
        ],
      };

