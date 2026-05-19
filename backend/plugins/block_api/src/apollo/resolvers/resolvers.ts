import contractCustomResolvers from '@/contract/graphql/resolvers/customResolvers';
import projectCustomResolvers from '@/project/graphql/resolvers/customResolvers';
import unitCustomResolvers from '@/unit/graphql/resolvers/customResolvers';

export const customResolvers = {
  ...unitCustomResolvers,
  ...projectCustomResolvers,
  ...contractCustomResolvers,
};
