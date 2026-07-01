import { apolloCustomScalars } from 'erxes-api-shared/utils';
import { queries } from './queries';
import { mutations } from './mutations';
import { agentCustomResolvers } from '@/agent/graphql/resolvers/queries/agent';
import { learningCustomResolvers } from '@/learning/graphql/resolvers/queries/learning';
import { scheduleCustomResolvers } from '@/schedule/graphql/resolvers/queries/schedule';
import { skillCustomResolvers } from '@/skills/graphql/resolvers/queries/skills';

export const resolvers = {
  Query: { ...queries },
  Mutation: { ...mutations },
  ...apolloCustomScalars,
  ...agentCustomResolvers,
  ...learningCustomResolvers,
  ...scheduleCustomResolvers,
  ...skillCustomResolvers,
};
