import {
  queries as PostQueries,
  types as PostTypes,
} from '@/post/graphql/schemas/post';
import {
  mutations as ProfileMutations,
  queries as ProfileQueries,
  types as ProfileTypes,
} from '@/profile/graphql/schemas/profile';

export const types = `
  ${ProfileTypes}
  ${PostTypes}
`;

export const queries = `
  ${ProfileQueries}
  ${PostQueries}
`;

export const mutations = `
  ${ProfileMutations}
`;
