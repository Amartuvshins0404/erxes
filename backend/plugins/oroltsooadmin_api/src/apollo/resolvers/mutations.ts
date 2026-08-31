import { cpOroltsooMutations } from '@/clientportal/graphql/resolvers/mutations';
import { meetingMutations } from '@/meeting/graphql/resolvers/mutations/meeting';
import { profileMutations } from '@/profile/graphql/resolvers/mutations/profile';

export const mutations = {
  ...profileMutations,
  ...meetingMutations,

  ...cpOroltsooMutations,
};
