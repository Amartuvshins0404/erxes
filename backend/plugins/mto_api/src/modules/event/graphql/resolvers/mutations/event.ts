import { Resolver } from 'erxes-api-shared/core-types';
import { IEvent } from '@/event/@types/event';
import { IContext } from '~/connectionResolvers';

export const eventMutations: Record<string, Resolver> = {
  async mtoEventCreate(
    _root: undefined,
    doc: IEvent,
    { models }: IContext,
  ) {
    return models.Event.createEvent(doc);
  },

  async mtoEventUpdate(
    _root: undefined,
    { _id, ...doc }: { _id: string } & Partial<IEvent>,
    { models }: IContext,
  ) {
    return models.Event.updateEvent(_id, doc);
  },

  async mtoEventsRemove(
    _root: undefined,
    { ids }: { ids: string[] },
    { models }: IContext,
  ) {
    return models.Event.removeEvents(ids);
  },
};
