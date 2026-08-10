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
export const types = `
  ${agentTypes}
  ${providerTypes}
  ${settingsTypes}
  ${sessionTypes}
`;

export const queries = `
  ${agentQueries}
  ${providerQueries}
  ${settingsQueries}
  ${sessionQueries}
`;

export const mutations = `
  ${agentMutations}
  ${providerMutations}
  ${settingsMutations}
  ${sessionMutations}
`;
