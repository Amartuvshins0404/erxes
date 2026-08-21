import {
  mutations as EventMutations,
  queries as EventQueries,
  types as EventTypes,
} from '@/event/graphql/schemas/event';
import {
  mutations as InvitationMutations,
  queries as InvitationQueries,
  types as InvitationTypes,
} from '@/invitation/graphql/schemas/invitation';

export const types = `
  ${EventTypes}
  ${InvitationTypes}
`;

export const queries = `
  ${EventQueries}
  ${InvitationQueries}
`;

export const mutations = `
  ${EventMutations}
  ${InvitationMutations}
`;
