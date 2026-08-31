import { queries as cpPostQueries, types as cpPostTypes } from './post';
import {
  queries as cpProfileQueries,
  types as cpProfileTypes,
} from './profile';

export const types = `
  ${cpProfileTypes}
  ${cpPostTypes}
`;

export const queries = `
  ${cpProfileQueries}
  ${cpPostQueries}
`;
