import { ExpectedError } from 'erxes-api-shared/utils';
import { IContext, IModels } from '~/connectionResolvers';
import { IMastraSchedule } from '@/schedule/@types/schedule';
import { runSchedule } from '~/mastra/schedules/runner';
import { backgroundRunEnableError } from '~/mastra/auth/backgroundPrincipal';
import { requireUserId } from '@/_shared/auth';
import type { IMastraAgentDocument } from '@/agent/@types/agent';

/** The referenced agent must exist and be enabled before a schedule saves. */
const assertAgentRunnable = async (
  models: IModels,
  agentId: unknown,
): Promise<IMastraAgentDocument> => {
  if (typeof agentId !== 'string' || !agentId) {
    throw new ExpectedError('agentId must be a non-empty string');
  }
  const agent = await models.MastraAgent.findOne({ agentId, isEnabled: true });
  if (!agent)
    throw new ExpectedError(`Agent "${agentId}" not found or disabled`);
  return agent;
};

/**
 * A schedule may only be ENABLED when its agent is safe for unattended runs:
 * the secure path is configured (the erxes app token in Agent settings) AND the
 * agent does not run destructive ops without asking. Since step 22 the schedule
 * runs as the agent's SERVICE USER, so a human owner is no longer required.
 * Caught here so the misconfig surfaces at setup, not silently when the runner
 * fails closed at 3am.
 */
const assertScheduleEnablable = async (models: IModels, agentId: unknown) => {
  const agent = await assertAgentRunnable(models, agentId);
  const settings = await models.MastraSettings.getSettings();
  const error = backgroundRunEnableError({
    destructiveAllow: agent.destructiveOps === 'allow',
    subject: 'schedule',
    appToken: settings?.erxesApiToken,
  });
  if (error) throw new ExpectedError(error);
};

/** Mutations for scheduled agent runs. */
export const scheduleMutations = {
  mastraScheduleCreate: async (
    _parent: undefined,
    { doc }: { doc: IMastraSchedule },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesCreate');
    const userId = requireUserId(user);
    // Creating already-enabled gates on the same background preconditions as a
    // later enable; otherwise only require the agent to exist.
    if (doc.isEnabled) await assertScheduleEnablable(models, doc.agentId);
    else await assertAgentRunnable(models, doc.agentId);
    return models.MastraSchedule.createSchedule({
      ...doc,
      createdByUserId: userId,
    });
  },

  mastraScheduleUpdate: async (
    _parent: undefined,
    { _id, doc }: { _id: string; doc: Partial<IMastraSchedule> },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesEdit');
    requireUserId(user);
    if (doc.agentId !== undefined) {
      await assertAgentRunnable(models, doc.agentId);
    }
    // Validate the background preconditions whenever the resulting schedule is
    // enabled — either this update enables it, or it was already enabled and the
    // agent is being repointed. The effective agent is the new one if supplied,
    // else the existing one.
    const existing = await models.MastraSchedule.getSchedule(_id);
    const willBeEnabled =
      doc.isEnabled !== undefined ? doc.isEnabled : existing.isEnabled;
    if (willBeEnabled) {
      await assertScheduleEnablable(models, doc.agentId ?? existing.agentId);
    }
    return models.MastraSchedule.updateSchedule(_id, doc);
  },

  mastraScheduleRemove: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesRemove');
    requireUserId(user);
    return models.MastraSchedule.removeSchedule(_id);
  },

  mastraScheduleSetEnabled: async (
    _parent: undefined,
    { _id, isEnabled }: { _id: string; isEnabled: boolean },
    { models, user, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesEdit');
    requireUserId(user);
    // Enabling is the moment the cron becomes live — gate it on the secure
    // background preconditions.
    if (isEnabled) {
      const schedule = await models.MastraSchedule.getSchedule(_id);
      await assertScheduleEnablable(models, schedule.agentId);
    }
    return models.MastraSchedule.setEnabled(_id, isEnabled);
  },

  // Manual fire. Allowed even when the schedule is disabled — disabling gates
  // the cron, not deliberate test runs (same contract as workflow run-start).
  mastraScheduleRunNow: async (
    _parent: undefined,
    { _id }: { _id: string },
    { models, subdomain, user, checkPermission }: IContext,
  ) => {
    await checkPermission('schedulesRun');
    requireUserId(user);
    const schedule = await models.MastraSchedule.getSchedule(_id);
    await runSchedule({ models, subdomain, schedule });
    return models.MastraSchedule.getSchedule(_id);
  },
};
