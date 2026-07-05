import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IMastraScheduleDocument } from '@/schedule/@types/schedule';
import { scheduleThreadId } from '~/mastra/schedules/runner';
import { scopedResource } from '~/mastra/memory/mastraMemory';
import { getThreadMessagesByResource } from '@/session/nativeStore';
import { canUserAccessAgent, isAgentAdmin, getUserUnitIds } from '@/agent/utils';
import { requireUserId } from '@/_shared/auth';

/** Queries over scheduled agent runs. */
export const scheduleQueries = {
  mastraSchedules: async (
    _parent: undefined,
    { agentId }: { agentId?: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesView');
    requireUserId(user);
    // Optional per-agent scoping — step 25's UI lists a single agent's schedules.
    return models.MastraSchedule.getSchedules({ agentId });
  },

  mastraSchedule: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesView');
    requireUserId(user);
    return models.MastraSchedule.getSchedule(_id);
  },

  /**
   * Read-only transcript of a schedule's dedicated output thread.
   *
   * Authorization is by AGENT ACCESS — the exact single-source-of-truth check
   * the agent list/workspace uses (canUserAccessAgent, @/agent/utils) — NOT
   * thread ownership: "if you can see the agent, you can read its scheduled
   * runs." The thread itself is owned by the background principal the run
   * executed as, so an ownership-scoped read (getOwnedThreadMessages) would
   * always return "not found" for the viewer.
   *
   * The read then uses the SCHEDULE'S OWN resource — scopedResource(subdomain,
   * `schedule:<id>`), identical to the memory binding runSchedule() writes under
   * (mastra/schedules/runner.ts) — never the viewer's resource. This is the
   * security linchpin: an unauthorized caller is refused with a generic
   * not-found (no leak of existence), and an authorized caller can only ever
   * reach the one thread bound to that schedule's agent — never widen access to
   * another user's or another agent's threads.
   */
  mastraScheduleTranscript: async (
    _parent: undefined,
    { scheduleId }: { scheduleId: string },
    { models, user, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesView');
    const userId = requireUserId(user);

    const schedule = await models.MastraSchedule.getSchedule(scheduleId);

    // Authorize by agent access (same helper the agents list resolver uses).
    const agent = await models.MastraAgent.findOne({
      agentId: schedule.agentId,
    });
    const unitIds = await getUserUnitIds(models, userId);
    const authorized =
      agent &&
      canUserAccessAgent(
        agent,
        userId,
        isAgentAdmin(user),
        user?.branchIds ?? [],
        user?.departmentIds ?? [],
        unitIds,
      );
    // Generic error — never distinguish "no such schedule" from "not yours".
    if (!authorized) throw new ExpectedError('Schedule transcript not found');

    // Read with the schedule's OWN background resource, not the viewer's.
    const resourceId = scopedResource(subdomain, `schedule:${schedule._id}`);
    return getThreadMessagesByResource(
      subdomain,
      scheduleThreadId(schedule._id),
      resourceId,
    );
  },
};

/** Field resolvers — threadId is derived, never stored. */
export const scheduleCustomResolvers = {
  MastraSchedule: {
    threadId: (schedule: IMastraScheduleDocument) =>
      scheduleThreadId(schedule._id),
  },
};
