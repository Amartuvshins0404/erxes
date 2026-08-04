import { ICursorPaginateParams, Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { InvitationQueryParams } from '@/invitation/@types/invitation';

export const invitationQueries: Record<string, Resolver> = {
  async eventInvitations(
    _root: undefined,
    params: InvitationQueryParams & ICursorPaginateParams,
    { models }: IContext,
  ) {
    return models.Invitations.listInvitations(params);
  },

  async eventAttendanceSummary(
    _root: undefined,
    { eventId }: { eventId: string },
    { models }: IContext,
  ) {
    return models.Invitations.getAttendanceSummary(eventId);
  },
};

export const invitationClientPortalQueries: Record<string, Resolver> = {
  async cpEventInvitations(
    _root: undefined,
    _params: undefined,
    { models, cpUser }: IContext,
  ) {
    return models.Invitations.listForCpUser(cpUser._id);
  },
};

markResolvers(invitationClientPortalQueries, {
  wrapperConfig: { forClientPortal: true, cpUserRequired: true },
});
