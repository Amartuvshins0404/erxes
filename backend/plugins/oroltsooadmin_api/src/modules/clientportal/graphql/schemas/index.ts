import {
  mutations as cpMeetingMutations,
  queries as cpMeetingQueries,
  types as cpMeetingTypes,
} from './meeting';
import { queries as cpPostQueries, types as cpPostTypes } from './post';
import {
  queries as cpProfileQueries,
  types as cpProfileTypes,
} from './profile';

export const types = `
  ${cpProfileTypes}
  ${cpPostTypes}
  ${cpMeetingTypes}
`;

export const queries = `
  ${cpProfileQueries}
  ${cpPostQueries}
  ${cpMeetingQueries}
`;

export const mutations = `
  ${cpMeetingMutations}
`;
