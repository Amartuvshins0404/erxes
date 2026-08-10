import { startPlugin } from 'erxes-api-shared/utils';
import resolvers from '~/apollo/resolvers';
import { typeDefs } from '~/apollo/typeDefs';
import { generateModels } from '~/connectionResolvers';
import { payments } from '~/meta/payments';
import { router } from '~/routes';

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
  meta: {
    payments,
  },
});
