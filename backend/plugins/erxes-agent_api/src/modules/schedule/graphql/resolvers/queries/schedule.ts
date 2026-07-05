import { IContext } from '~/connectionResolvers';
import { IMastraScheduleDocument } from '@/schedule/@types/schedule';
import { scheduleThreadId } from '~/mastra/schedules/runner';
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
};

/** Field resolvers — threadId is derived, never stored. */
export const scheduleCustomResolvers = {
  MastraSchedule: {
    threadId: (schedule: IMastraScheduleDocument) =>
      scheduleThreadId(schedule._id),
  },
};
