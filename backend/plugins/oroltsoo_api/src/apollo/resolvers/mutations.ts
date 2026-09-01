import { postMutations } from '@/post/graphql/resolvers/mutations/post';
import { profileMutations } from '@/profile/graphql/resolvers/mutations/profile';

export const mutations = {
  ...profileMutations,
  ...postMutations,
};
