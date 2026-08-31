import { cpPostQueries } from './post';
import { cpProfileQueries } from './profile';

export const cpOroltsooQueries = {
  ...cpProfileQueries,
  ...cpPostQueries,
};
