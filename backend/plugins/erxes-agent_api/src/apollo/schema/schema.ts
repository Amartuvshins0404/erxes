import {
  types as agentTypes,
  queries as agentQueries,
  mutations as agentMutations,
} from '@/agent/graphql/schemas/agent';
import {
  types as providerTypes,
  queries as providerQueries,
  mutations as providerMutations,
} from '@/provider/graphql/schemas/provider';
import {
  types as settingsTypes,
  queries as settingsQueries,
  mutations as settingsMutations,
} from '@/settings/graphql/schemas/settings';
import {
  types as sessionTypes,
  queries as sessionQueries,
  mutations as sessionMutations,
} from '@/session/graphql/schemas/session';
import {
  types as workflowTypes,
  queries as workflowQueries,
  mutations as workflowMutations,
} from '@/workflow/graphql/schemas/workflow';
import {
  types as learningTypes,
  queries as learningQueries,
  mutations as learningMutations,
} from '@/learning/graphql/schemas/learning';
import {
  types as skillTypes,
  queries as skillQueriesSchema,
  mutations as skillMutationsSchema,
} from '@/skills/graphql/schemas/skills';

export const types = `
  ${agentTypes}
  ${providerTypes}
  ${settingsTypes}
  ${sessionTypes}
  ${workflowTypes}
  ${learningTypes}
  ${skillTypes}
`;

export const queries = `
  ${agentQueries}
  ${providerQueries}
  ${settingsQueries}
  ${sessionQueries}
  ${workflowQueries}
  ${learningQueries}
  ${skillQueriesSchema}
`;

export const mutations = `
  ${agentMutations}
  ${providerMutations}
  ${settingsMutations}
  ${sessionMutations}
  ${workflowMutations}
  ${learningMutations}
  ${skillMutationsSchema}
`;
