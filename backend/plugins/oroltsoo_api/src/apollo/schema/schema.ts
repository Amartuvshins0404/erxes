import {
  queries as MeetingQueries,
  types as MeetingTypes,
} from '@/meeting/graphql/schemas/meeting';
import {
  mutations as PostMutations,
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
  ${MeetingTypes}
  ${PostTypes}
`;

export const queries = `
  ${ProfileQueries}
  ${MeetingQueries}
  ${PostQueries}
`;

export const mutations = `
  ${ProfileMutations}
  ${PostMutations}
`;
