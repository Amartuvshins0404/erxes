import { IContext } from '~/connectionResolvers';
import { IEventInvitationDocument } from '@/invitation/@types/invitation';

export const EventInvitation = {
  event: async (
    invitation: IEventInvitationDocument,
    _params: undefined,
    { models }: IContext,
  ) => {
    if (!invitation.eventId) {
      return null;
    }

    return models.Events.findOne({ _id: invitation.eventId });
  },

  customer: async (invitation: IEventInvitationDocument) => {
    if (!invitation.customerId) {
      return null;
    }

    return { __typename: 'Customer', _id: invitation.customerId };
  },
};
