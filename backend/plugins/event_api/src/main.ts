import { startPlugin } from 'erxes-api-shared/utils';
import { resolvers } from '~/apollo/resolvers';
import { typeDefs } from '~/apollo/typeDefs';
import { appRouter } from '~/trpc/init-trpc';
import { generateModels } from '~/connectionResolvers';
import { notifications } from '~/meta/notifications';
import { permissions } from '~/meta/permissions';

startPlugin({
  name: 'event',
  port: 33017,
  graphql: async () => ({
    typeDefs: await typeDefs(),
    resolvers,
  }),
  apolloServerContext: async (subdomain, context) => {
    const models = await generateModels(subdomain, context);

    context.models = models;

    return context;
  },
  trpcAppRouter: {
    router: appRouter,
    createContext: async (subdomain, context) => {
      const models = await generateModels(subdomain, context);

      context.models = models;

      return context;
    },
  },
  meta: {
    permissions,
    notifications,
  },
});
