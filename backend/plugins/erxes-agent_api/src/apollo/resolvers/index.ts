import { apolloCustomScalars } from 'erxes-api-shared/utils';
import { queries } from './queries';
import { mutations } from './mutations';
import { agentCustomResolvers } from '@/agent/graphql/resolvers/queries/agent';
import { learningCustomResolvers } from '@/learning/graphql/resolvers/queries/learning';
import { skillCustomResolvers } from '@/skills/graphql/resolvers/queries/skills';
import { workflowCustomResolvers } from '@/workflow/graphql/resolvers/queries/workflow';

export const resolvers = {
  Query: { ...queries },
  Mutation: { ...mutations },
  ...apolloCustomScalars,
  ...agentCustomResolvers,
  ...learningCustomResolvers,
  ...skillCustomResolvers,
  ...workflowCustomResolvers,
};
