import './polyfills'; // must stay first — patches globals Mastra needs on Node 18
import { redis, startPlugin } from 'erxes-api-shared/utils';
import { createHash } from 'node:crypto';
import { typeDefs } from '~/apollo/typeDefs';
import { resolvers } from '~/apollo/resolvers';
import { generateModels } from './connectionResolvers';
import { router } from './routes';
import { appRouter } from '~/trpc/init-trpc';
import { permissions } from '~/meta/permissions';
import { migrateAgentAccounts } from '~/migrations/migrateAgentAccounts';

startPlugin({
  name: 'erxes-agent',
  port: 3312,
  meta: {
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
        let cursor = 0;
        do {
          const [next, batch] = await redis.scan(
            cursor,
            'MATCH',
            'user_actions_*',
            'COUNT',
            100,
          );
          cursor = parseInt(next, 10);
          if (batch.length) await redis.del(...batch);
        } while (cursor !== 0);
        await redis.set(HASH_KEY, current);
      }
    }

    // Canonicalize every legacy agent/service-user pair before an agent can
    // execute under an AI team-member identity.
    await migrateAgentAccounts();
  },
});
