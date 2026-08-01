import { agentQueries } from '@/agent/graphql/resolvers/queries/agent';
import { providerQueries } from '@/provider/graphql/resolvers/queries/provider';
import { settingsQueries } from '@/settings/graphql/resolvers/queries/settings';
import { sessionQueries } from '@/session/graphql/resolvers/queries/session';
import { workflowQueries } from '@/workflow/graphql/resolvers/queries/workflow';
import { learningQueries } from '@/learning/graphql/resolvers/queries/learning';
import { skillQueries } from '@/skills/graphql/resolvers/queries/skills';

export const queries = {
  ...agentQueries,
  ...providerQueries,
  ...settingsQueries,
  ...sessionQueries,
  ...workflowQueries,
  ...learningQueries,
  ...skillQueries,
};
