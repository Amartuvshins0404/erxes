import { Mastra } from '@mastra/core/mastra';
import type { Schedule, SchedulesStorage } from '@mastra/core/storage';
import {
  computeNextFireAt,
  createEventedWorkflow,
  createStep,
} from '@mastra/core/workflows';
import { MongoDBStore } from '@mastra/mongodb';
import { z } from 'zod';
import { getEnv, getSaasOrganizations } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import { generateModels } from '~/connectionResolvers';
import { runBackgroundWorkflow } from '~/mastra/workflows/runtime';
import { registerScheduleSync } from '~/mastra/scheduleSync';

const DISPATCH_WORKFLOW_ID = 'erxes-scheduled-dispatch';
const SCHEDULE_OWNER = 'erxes-agent';

const dispatchInputSchema = z.object({
  subdomain: z.string().min(1),
  workflowId: z.string().min(1),
});

const dispatchOutputSchema = z.object({
  status: z.string(),
  runId: z.string().optional(),
  error: z.string().optional(),
});

type DispatchInput = z.infer<typeof dispatchInputSchema>;

type ScheduleRuntime = {
  mastra: Mastra;
  store: SchedulesStorage;
};

let runtimePromise: Promise<ScheduleRuntime> | undefined;

/** One Mastra workflow dispatches every scheduled workflow definition. */
export async function dispatchScheduledRun(input: DispatchInput) {
  const models = await generateModels(input.subdomain);
  const workflow = await models.MastraWorkflow.findOne({
    _id: input.workflowId,
  });
  if (
    !workflow ||
    !workflow.isEnabled ||
    workflow.approvalStatus !== 'approved' ||
    workflow.definition?.trigger?.type !== 'schedule'
  ) {
    return { status: 'skipped' };
  }

  const run = await runBackgroundWorkflow({
    models,
    subdomain: input.subdomain,
    workflow,
    envelope: {
      source: 'schedule',
      type: 'schedule',
      payload: { firedAt: new Date().toISOString() },
    },
  });
  return { status: run.status, runId: run._id };
}

const dispatchStep = createStep({
  id: 'dispatch-scheduled-run',
  inputSchema: dispatchInputSchema,
  outputSchema: dispatchOutputSchema,
  execute: ({ inputData }) => dispatchScheduledRun(inputData),
});

const dispatchWorkflow = createEventedWorkflow({
  id: DISPATCH_WORKFLOW_ID,
  inputSchema: dispatchInputSchema,
  outputSchema: dispatchOutputSchema,
})
  .then(dispatchStep)
  .commit();

async function createRuntime(): Promise<ScheduleRuntime> {
  const storage = new MongoDBStore({
    id: 'erxes-agent-scheduler',
    uri: process.env.MONGO_URL || 'mongodb://localhost:27017',
    dbName: process.env.ERXES_AGENT_SCHEDULER_DB || 'erxes_mastra_scheduler',
  });
  const mastra = new Mastra({
    workflows: { [DISPATCH_WORKFLOW_ID]: dispatchWorkflow },
    storage,
    scheduler: {
      enabled: true,
      onError: (error, { scheduleId }) =>
        console.error(
          `[erxes-agent:scheduler] ${scheduleId} failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ),
    },
    notifications: { dispatch: { enabled: false } },
    logger: false,
  });

  await mastra.startWorkers();
  const store = await storage.getStore('schedules');
  if (!store) throw new Error('Mastra schedule storage is unavailable');
  return { mastra, store };
}

async function getRuntime(): Promise<ScheduleRuntime> {
  runtimePromise ??= createRuntime();
  return runtimePromise;
}

function buildScheduleRow(
  input: DispatchInput,
  cron: string,
  timezone: string,
  isEnabled: boolean,
): Schedule {
  const now = Date.now();
  return {
    id: `erxes:workflow:${input.subdomain.length}:${input.subdomain}:${input.workflowId}`,
    target: {
      type: 'workflow',
      workflowId: DISPATCH_WORKFLOW_ID,
      inputData: input,
    },
    cron,
    timezone,
    status: isEnabled ? 'active' : 'paused',
    nextFireAt: computeNextFireAt(cron, { timezone, after: now }),
    createdAt: now,
    updatedAt: now,
    ownerType: SCHEDULE_OWNER,
    ownerId: input.subdomain,
    metadata: {
      workflowId: input.workflowId,
      subdomain: input.subdomain,
    },
  };
}

async function upsertScheduleRow(
  store: SchedulesStorage,
  row: Schedule,
  listed?: Schedule,
): Promise<void> {
  let current = listed ?? (await store.getSchedule(row.id)) ?? undefined;
  if (!current) {
    try {
      await store.createSchedule(row);
      return;
    } catch (error) {
      // Concurrent synchronizers may both observe a missing row. Mastra's
      // create is intentionally strict, so recover only when the row now exists.
      current = (await store.getSchedule(row.id)) ?? undefined;
      if (!current) throw error;
    }
  }

  const timingChanged =
    current.cron !== row.cron || current.timezone !== row.timezone;
  const resumed = current.status === 'paused' && row.status === 'active';
  await store.updateSchedule(row.id, {
    cron: row.cron,
    timezone: row.timezone,
    status: row.status,
    target: row.target,
    ownerType: row.ownerType,
    ownerId: row.ownerId,
    metadata: row.metadata,
    ...(timingChanged || resumed ? { nextFireAt: row.nextFireAt } : {}),
  });
}

/** Projects one tenant's schedule-triggered workflows into Mastra. */
export async function syncTenantSchedules(
  models: IModels,
  subdomain: string,
): Promise<void> {
  const { store } = await getRuntime();
  const [workflows, existing] = await Promise.all([
    models.MastraWorkflow.getWorkflows(),
    store.listSchedules({ ownerType: SCHEDULE_OWNER, ownerId: subdomain }),
  ]);

  const desired = new Map<string, Schedule>();
  for (const workflow of workflows) {
    const trigger = workflow.definition?.trigger;
    if (trigger?.type !== 'schedule') continue;
    const cron = trigger.config?.cron;
    if (typeof cron !== 'string' || !cron.trim()) continue;
    const timezone =
      typeof trigger.config?.timezone === 'string'
        ? trigger.config.timezone
        : 'UTC';
    const input: DispatchInput = {
      subdomain,
      workflowId: workflow._id,
    };
    const row = buildScheduleRow(
      input,
      cron.trim(),
      timezone,
      workflow.isEnabled && workflow.approvalStatus === 'approved',
    );
    desired.set(row.id, row);
  }

  for (const row of existing) {
    if (!desired.has(row.id)) await store.deleteSchedule(row.id);
  }

  for (const row of desired.values()) {
    await upsertScheduleRow(
      store,
      row,
      existing.find(({ id }) => id === row.id),
    );
  }
}

async function tenants(): Promise<string[]> {
  if (getEnv({ name: 'VERSION' }) === 'saas') {
    const orgs = await getSaasOrganizations();
    return orgs.map((org: { subdomain: string }) => org.subdomain);
  }
  return ['os'];
}

/** Starts Mastra's scheduler and projects every tenant's current configuration. */
export async function initMastraScheduler(): Promise<void> {
  registerScheduleSync(syncTenantSchedules);
  await getRuntime();
  for (const subdomain of await tenants()) {
    try {
      const models = await generateModels(subdomain);
      await syncTenantSchedules(models, subdomain);
    } catch (error) {
      console.error(
        `[erxes-agent:scheduler] sync failed for ${subdomain}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
