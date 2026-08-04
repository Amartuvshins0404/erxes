import { IContext } from '~/connectionResolvers';
import { IEventDocument } from '@/event/@types/event';

export const Event = {
  __resolveReference: async (
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Events.getEvent(_id);
  },

  owner: (event: IEventDocument) => {
    if (!event.ownerId) {
      return null;
    }

    return { __typename: 'User', _id: event.ownerId };
  },

  goingCount: async (
    event: IEventDocument,
    _params: undefined,
    { models }: IContext,
  ) => {
    return models.Invitations.countGoing(event._id);
  },

  agenda: async (
    event: IEventDocument,
    _params: undefined,
    { models }: IContext,
  ) => {
    return models.EventAgendas.listByEventId(event._id);
  },
};
