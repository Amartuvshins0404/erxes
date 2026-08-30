import {
  mutations as AgentsConnectionMutations,
  queries as AgentsConnectionQueries,
  types as AgentsConnectionTypes,
} from '@/agents/graphql/schemas/connection';
import {
  mutations as AgentsThreadMutations,
  queries as AgentsThreadQueries,
  types as AgentsThreadTypes,
} from '@/agents/graphql/schemas/threads';

export const types = `
  ${AgentsConnectionTypes}
  ${AgentsThreadTypes}
`;

export const queries = `
  ${AgentsConnectionQueries}
  ${AgentsThreadQueries}
`;

export const mutations = `
  ${AgentsConnectionMutations}
  ${AgentsThreadMutations}
`;
