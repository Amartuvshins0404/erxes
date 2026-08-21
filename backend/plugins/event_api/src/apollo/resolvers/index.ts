import { apolloCustomScalars } from 'erxes-api-shared/utils';
import { mutations } from './mutations';
import { queries } from './queries';
import { customResolvers } from './resolvers';

export const resolvers = {
  Query: {
    ...queries,
  },
  Mutation: {
    ...mutations,
  },
  ...apolloCustomScalars,
  ...customResolvers,
};
