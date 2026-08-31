import { agentsConnectionMutations } from '@/agents/graphql/resolvers/mutations/connection';
import { agentsThreadMutations } from '@/agents/graphql/resolvers/mutations/threads';

export const mutations = {
  ...agentsConnectionMutations,
  ...agentsThreadMutations,
};
