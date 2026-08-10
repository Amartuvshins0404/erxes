import {
  eventClientPortalMutations,
  eventMutations,
} from '@/event/graphql/resolvers/mutations/event';
import {
  invitationClientPortalMutations,
  invitationMutations,
} from '@/invitation/graphql/resolvers/mutations/invitation';

export const mutations = {
  ...eventMutations,
  ...eventClientPortalMutations,
  ...invitationMutations,
  ...invitationClientPortalMutations,
};
