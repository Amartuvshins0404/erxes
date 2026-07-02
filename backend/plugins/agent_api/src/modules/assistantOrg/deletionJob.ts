import { getEnv, getSaasOrgsCache } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { destroyServer } from '~/modules/agent/utils';
import { getAssistantLimit } from '~/modules/assistantOrg/assistantLimits';

// How often the sweep runs. The grace period is 21 days, so a coarse cadence
// is plenty — we only need to catch organizations a little after they cross
// the deletion threshold.
const SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
const INITIAL_DELAY_MS = 5 * 60 * 1000; // 5 minutes after boot

let sweepRunning = false;

const logPrefix = '[assistant-deletion-sweep]';

const deleteServersForSubdomain = async (subdomain: string) => {
  const models = await generateModels(subdomain);

  const serverCount = await models.AgentServer.countDocuments({});

  if (serverCount === 0) {
    return;
  }

  const limit = await getAssistantLimit({ models, subdomain });

  // Only delete once the 21-day grace period after the unpaid plan end has
  // fully elapsed. `deletionDue` already encodes "no active plan + past grace".
  if (!limit.billingWarning?.deletionDue) {
    return;
  }

  const servers = await models.AgentServer.find({}).lean();

  for (const server of servers) {
    try {
      await destroyServer(server);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // A server that no longer exists on the deployer is fine — keep going so
      // we still clean up the database records below.
      if (!message.toLowerCase().includes('not found')) {
        console.error(
          `${logPrefix} failed to destroy server "${server.name}" for ${subdomain}: ${message}`,
        );
        continue;
      }
    }

    await models.AgentServer.deleteOne({ _id: server._id });

    if (server.identifierId) {
      await models.Identifier.deleteOne({
        _id: server.identifierId,
        kind: 'assistant',
      });
    }

    console.log(
      `${logPrefix} deleted overdue assistant server "${server.name}" for ${subdomain}`,
    );
  }
};

export const runAssistantDeletionSweep = async () => {
  if (sweepRunning) {
    return;
  }

  sweepRunning = true;

  try {
    const organizations = await getSaasOrgsCache({});

    if (!Array.isArray(organizations)) {
      return;
    }

    for (const organization of organizations) {
      const subdomain = organization?.subdomain;

      if (!subdomain) {
        continue;
      }

      try {
        await deleteServersForSubdomain(subdomain);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `${logPrefix} sweep failed for ${subdomain}: ${message}`,
        );
      }
    }
  } finally {
    sweepRunning = false;
  }
};

export const startAssistantDeletionCron = () => {
  const VERSION = getEnv({ name: 'VERSION', defaultValue: 'os' });

  // Tenant-scoped assistant billing only exists in SaaS mode.
  if (VERSION !== 'saas') {
    return;
  }

  if (
    getEnv({ name: 'DISABLE_ASSISTANT_DELETION_SWEEP' }).trim() === 'true'
  ) {
    console.log(`${logPrefix} disabled via DISABLE_ASSISTANT_DELETION_SWEEP`);
    return;
  }

  const run = () => {
    runAssistantDeletionSweep().catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`${logPrefix} unexpected sweep error: ${message}`);
    });
  };

  setTimeout(run, INITIAL_DELAY_MS);
  setInterval(run, SWEEP_INTERVAL_MS);

  console.log(`${logPrefix} scheduled (every ${SWEEP_INTERVAL_MS / 3600000}h)`);
};
