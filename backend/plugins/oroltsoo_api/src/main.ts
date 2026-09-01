import { startPlugin } from 'erxes-api-shared/utils';

import { resolvers } from '~/apollo/resolvers';
import { typeDefs } from '~/apollo/typeDefs';
import { generateModels } from '~/connectionResolvers';
import { permissions } from '~/meta/permissions';
import { router } from '~/routes';
import { appRouter } from '~/trpc/init-trpc';

startPlugin({
  name: 'oroltsoo',
  port: 33018,
  graphql: async () => ({
    typeDefs: await typeDefs(),
    resolvers,
  }),
  expressRouter: router,
  meta: {
    permissions,
  },
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
});
