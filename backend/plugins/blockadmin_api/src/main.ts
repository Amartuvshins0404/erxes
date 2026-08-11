import { redis, startPlugin } from 'erxes-api-shared/utils';
import resolvers from '~/apollo/resolvers';
import { typeDefs } from '~/apollo/typeDefs';
import { generateModels } from '~/connectionResolvers';
import { payments } from '~/meta/payments';
import { router } from '~/routes';
import { initMQWorkers } from '~/worker';

startPlugin({
  name: 'blockadmin',
  port: 33012,
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
  onServerInit: async () => {
    await initMQWorkers(redis);
  },
  meta: {
    payments,
  },
});
