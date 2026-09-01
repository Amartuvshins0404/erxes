import {
  mutations as ClientPortalMutations,
  queries as ClientPortalQueries,
  types as ClientPortalTypes,
} from '@/clientportal/graphql/schemas';
import {
  mutations as MeetingMutations,
  queries as MeetingQueries,
  types as MeetingTypes,
} from '@/meeting/graphql/schemas/meeting';
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
  ${MeetingTypes}

  ${ClientPortalTypes}
`;

export const queries = `
  ${ProfileQueries}
  ${PostQueries}
  ${MeetingQueries}

  ${ClientPortalQueries}
`;

export const mutations = `
  ${ProfileMutations}
  ${MeetingMutations}

  ${ClientPortalMutations}
`;
