import { agentQueries } from '@/agent/graphql/resolvers/queries/agent';
import { providerQueries } from '@/provider/graphql/resolvers/queries/provider';
import { settingsQueries } from '@/settings/graphql/resolvers/queries/settings';
import { sessionQueries } from '@/session/graphql/resolvers/queries/session';

export const queries = {
  ...agentQueries,
  ...providerQueries,
  ...settingsQueries,
  ...sessionQueries,
};
