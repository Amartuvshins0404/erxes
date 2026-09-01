import { cpOroltsooQueries } from '@/clientportal/graphql/resolvers/queries';
import { meetingQueries } from '@/meeting/graphql/resolvers/queries/meeting';
import { postQueries } from '@/post/graphql/resolvers/queries/post';
import { profileQueries } from '@/profile/graphql/resolvers/queries/profile';

export const queries = {
  ...profileQueries,
  ...postQueries,
  ...meetingQueries,

  ...cpOroltsooQueries,
};
