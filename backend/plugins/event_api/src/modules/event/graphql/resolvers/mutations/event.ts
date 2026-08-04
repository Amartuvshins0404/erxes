import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IEventInput } from '@/event/@types/event';

export const eventMutations: Record<string, Resolver> = {
  async eventsAdd(
    _root: undefined,
    { doc }: { doc: IEventInput },
    { models, user }: IContext,
  ) {
    return models.Events.createEvent(doc, user._id);
  },

  async eventsEdit(
    _root: undefined,
    { _id, doc }: { _id: string; doc: IEventInput },
    { models }: IContext,
  ) {
    return models.Events.updateEvent(_id, doc);
  },

  async eventsRemove(
    _root: undefined,
    { _ids }: { _ids: string[] },
    { models }: IContext,
  ) {
    return models.Events.removeEvents(_ids);
  },
};

export const eventClientPortalMutations: Record<string, Resolver> = {
  async cpEventToggleSave(
    _root: undefined,
    { eventId }: { eventId: string },
    { models, cpUser }: IContext,
  ) {
    return models.SavedEvents.toggleSave(cpUser._id, eventId);
  },
};

markResolvers(eventClientPortalMutations, {
  wrapperConfig: { forClientPortal: true, cpUserRequired: true },
});
