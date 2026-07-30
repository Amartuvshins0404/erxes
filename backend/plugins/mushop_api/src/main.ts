import { startPlugin } from 'erxes-api-shared/utils';
import { typeDefs } from '~/apollo/typeDefs';
import { appRouter } from '~/trpc/init-trpc';
import resolvers from './apollo/resolvers';
import { generateModels } from './connectionResolvers';
import { payments } from './meta/payments';
import { permissions } from './meta/permissions';
import router from './routes';
import beforeResolvers from './meta/beforeResolvers';
import { afterProcess } from './meta/afterProcess';

startPlugin({
  name: 'mushop',
  port: 33014,
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
  meta: {
    payments,
    beforeResolvers,
    afterProcess,
    permissions,
  },
});
