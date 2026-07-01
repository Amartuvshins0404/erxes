import './polyfills'; // must stay first — patches globals Mastra needs on Node 18
import { startPlugin } from 'erxes-api-shared/utils';
import { typeDefs } from '~/apollo/typeDefs';
import { resolvers } from '~/apollo/resolvers';
import { generateModels } from './connectionResolvers';
import { router } from './routes';
import { appRouter } from '~/trpc/init-trpc';
import { automations } from '~/meta/automations';
import { permissions } from '~/meta/permissions';

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
      const [{ redis }, { createHash }] = await Promise.all([
        import('erxes-api-shared/utils'),
        import('crypto'),
      ]);
      const HASH_KEY = 'erxes-agent:permissions_hash';
      const current = createHash('sha256')
        .update(JSON.stringify(permissions))
        .digest('hex');
      const stored = await redis.get(HASH_KEY);
      if (stored !== current) {
        let cursor = 0;
        do {
          const [next, batch] = await redis.scan(cursor, 'MATCH', 'user_actions_*', 'COUNT', 100);
          cursor = parseInt(next, 10);
          if (batch.length) await redis.del(...batch);
        } while (cursor !== 0);
        await redis.set(HASH_KEY, current);
        console.log('[erxes-agent] permissions changed — user action cache cleared');
      }
    }

    // Advanced memory is on by default (chat persistence rides on it); ping
    // Qdrant and ensure the collection exists. Loaded lazily, and skipped only
    // when explicitly disabled via ERXES_AGENT_MEMORY=disable.
    if ((process.env.ERXES_AGENT_MEMORY ?? '').trim() !== 'disable') {
      const { initAdvancedMemory } = await import('~/mastra/memory');
      await initAdvancedMemory();
    }

    // Company knowledge RAG (opt-in via ERXES_AGENT_KNOWLEDGE=enable): start the
    // reconciliation sweep scheduler + worker. Same lazy-load contract.
    if ((process.env.ERXES_AGENT_KNOWLEDGE ?? '').trim() === 'enable') {
      const [{ initKnowledgeSync }, { redis }] = await Promise.all([
        import('~/mastra/knowledge/worker'),
        import('erxes-api-shared/utils'),
      ]);
      initKnowledgeSync(redis);
    }

    // Agent learning (opt-in via ERXES_AGENT_LEARNING=enable): distillation +
    // hygiene sweep scheduler + worker. Same lazy-load contract.
    if ((process.env.ERXES_AGENT_LEARNING ?? '').trim() === 'enable') {
      const [{ initLearningSweep }, { redis }] = await Promise.all([
        import('~/mastra/learning/worker'),
        import('erxes-api-shared/utils'),
      ]);
      await initLearningSweep(redis);
    }

    // Workflow schedule trigger: reconcile BullMQ job schedulers with enabled
    // schedule-workflows (boot kick + every 5 minutes).
    {
      const [{ initWorkflowSchedules }, { redis }] = await Promise.all([
        import('~/mastra/workflows/scheduler'),
        import('erxes-api-shared/utils'),
      ]);
      await initWorkflowSchedules(redis);
    }

    // Agent schedules: reconcile BullMQ job schedulers with enabled
    // MastraSchedule documents (boot kick + every 5 minutes).
    {
      const [{ initAgentSchedules }, { redis }] = await Promise.all([
        import('~/mastra/schedules/scheduler'),
        import('erxes-api-shared/utils'),
      ]);
      await initAgentSchedules(redis);
    }
  },
});
