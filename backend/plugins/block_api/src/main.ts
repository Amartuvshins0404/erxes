import * as path from 'path';
import { startPlugin } from 'erxes-api-shared/utils';
import { typeDefs } from '~/apollo/typeDefs';
import { payments } from '~/meta/payments';
import { permissions } from '~/meta/permissions';
import { wrapMutationResolver } from '~/modules/admin/utils';
import resolvers from './apollo/resolvers';
import { generateModels } from './connectionResolvers';
import { router } from './routes';
import { appRouter } from './trpc/init-trpc';

startPlugin({
  name: 'block',
  port: 33011,
  graphql: async () => ({
    typeDefs: await typeDefs(),
    resolvers: {
      ...resolvers,
      Mutation: wrapMutationResolver(resolvers.Mutation),
    },
  }),
  expressRouter: router,
  hasSubscriptions: true,
  subscriptionPluginPath: path.resolve(
    __dirname,
    'apollo',
    process.env.NODE_ENV === 'production' ? 'subscription.js' : 'subscription.ts',
  ),
  meta: {
    permissions,
    payments,
    properties: {
      types: [
        {
          description: 'Opportunity',
          type: 'oppty',
        },
      ],
    },
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
