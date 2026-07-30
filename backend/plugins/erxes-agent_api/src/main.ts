import './polyfills'; // must stay first — patches globals Mastra needs on Node 18
import { redis, startPlugin } from 'erxes-api-shared/utils';
import { createHash } from 'crypto';
import { typeDefs } from '~/apollo/typeDefs';
import { resolvers } from '~/apollo/resolvers';
import { generateModels } from './connectionResolvers';
import { router } from './routes';
import { appRouter } from '~/trpc/init-trpc';
import { automations } from '~/meta/automations';
import { permissions } from '~/meta/permissions';
import { initMastraScheduler } from '~/mastra/scheduler';
import { backfillWorkflowAgents } from '~/mastra/workflows/agentBackfill';

startPlugin({
  name: 'erxes-agent',
  port: 3312,
  meta: {
    // The generic "Run agent workflow" action — every trigger the central
    // automations service knows can start an agent workflow through it.
    automations,
    // Permission map: every mutation/query and the /chat/stream route is gated
    // by one of these actions. Surfaces in the core permissions admin UI.
    permissions,
  },
  graphql: async () => ({
    typeDefs: await typeDefs(),
    resolvers,
  }),
  expressRouter: router,
  apolloServerContext: async (subdomain, context) => {
    const models = await generateModels(subdomain);
    context.models = models;
    return context;
  },
  trpcAppRouter: {
    router: appRouter,
    createContext: async (subdomain, context) => {
      const models = await generateModels(subdomain);
      context.models = models;
      return context;
    },
  },
  onServerInit: async () => {
    // Flush the per-user permission action cache when this plugin's permissions
    // definition has changed since the last startup. Uses SCAN (not KEYS) to
    // avoid blocking Redis on large keyspaces.
    {
      const HASH_KEY = 'erxes-agent:permissions_hash';
      const current = createHash('sha256')
        .update(JSON.stringify(permissions))
        .digest('hex');
      const stored = await redis.get(HASH_KEY);
      if (stored !== current) {
        for (const pattern of ['user_actions_*', 'user_action_scopes_*']) {
          let cursor = 0;
          do {
            const [next, batch] = await redis.scan(
              cursor,
              'MATCH',
              pattern,
              'COUNT',
              100,
            );
            cursor = parseInt(next, 10);
            if (batch.length) await redis.del(...batch);
          } while (cursor !== 0);
        }
        await redis.set(HASH_KEY, current);
        console.log(
          '[erxes-agent] permissions changed — user action cache cleared',
        );
      }
    }

    // Agent learning (opt-in via ERXES_AGENT_LEARNING=enable): distillation +
    // hygiene sweep scheduler + worker. Same lazy-load contract.
    if ((process.env.ERXES_AGENT_LEARNING ?? '').trim() === 'enable') {
      const { initLearningSweep } = await import('~/mastra/learning/worker');
      await initLearningSweep(redis);
    }

    // Workflow ownership backfill (step 24): best-effort assign an owning agent
    // to every legacy workflow before the schedule reconciler runs, disabling
    // unassignable ones. Idempotent-retry: it is a no-op once every workflow has
    // an agentId, and a workflow it can't process this boot (per-workflow error,
    // or a whole tenant failing) is simply retried on the next boot — it is not
    // a hard, exactly-once guarantee that every unassignable workflow is disabled
    // before anything else runs.
    await backfillWorkflowAgents();

    // Mastra owns recurrence, claiming, dispatch, and trigger history for
    // schedule-triggered workflow definitions.
    await initMastraScheduler();
  },
});
