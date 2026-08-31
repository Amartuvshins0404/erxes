import { meetingMutations } from '@/meeting/graphql/resolvers/mutations/meeting';
import { profileMutations } from '@/profile/graphql/resolvers/mutations/profile';

export const mutations = {
  ...profileMutations,
  ...meetingMutations,
};
