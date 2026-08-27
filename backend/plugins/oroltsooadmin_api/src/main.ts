import { startPlugin } from 'erxes-api-shared/utils';

import { resolvers } from '~/apollo/resolvers';
import { typeDefs } from '~/apollo/typeDefs';
import { generateModels } from '~/connectionResolvers';
import { router } from '~/routes';

startPlugin({
  name: 'oroltsooadmin',
  port: 33019,
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
});
