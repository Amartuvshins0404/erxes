import { agentsConnectionsQueries } from '@/agents/graphql/resolvers/queries/connection';
import { agentsModelsQueries } from '@/agents/graphql/resolvers/queries/models';
import { agentsThreadsQueries } from '@/agents/graphql/resolvers/queries/threads';

export const queries = {
  ...agentsConnectionsQueries,
  ...agentsModelsQueries,
  ...agentsThreadsQueries,
};
