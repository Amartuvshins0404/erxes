import {
  eventClientPortalQueries,
  eventQueries,
} from '@/event/graphql/resolvers/queries/event';
import {
  invitationClientPortalQueries,
  invitationQueries,
} from '@/invitation/graphql/resolvers/queries/invitation';

export const queries = {
  ...eventQueries,
  ...eventClientPortalQueries,
  ...invitationQueries,
  ...invitationClientPortalQueries,
};
