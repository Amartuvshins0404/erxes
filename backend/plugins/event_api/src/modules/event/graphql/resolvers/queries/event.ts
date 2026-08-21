import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { EventStatus } from '@/event/constants';
import { EventQueryParams } from '@/event/@types/event';

type ListParams = EventQueryParams & ICursorPaginateParams;

export const eventQueries: Record<string, Resolver> = {
  async events(_root: undefined, params: ListParams, { models }: IContext) {
    return models.Events.listEvents(params);
  },

  async eventDetail(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    return models.Events.getEvent(_id);
  },
};

export const eventClientPortalQueries: Record<string, Resolver> = {
  async cpEvents(_root: undefined, params: ListParams, { models, cpUser }: IContext) {
    return models.Events.listEventsForCpUser({
      ...params,
      cpUserId: cpUser._id,
    });
  },

  async cpEventDetail(
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) {
    const event = await models.Events.getEvent(_id);

    if (event.status !== EventStatus.PUBLISHED) {
      throw new Error('Event not found');
    }

    return event;
  },

  async cpEventSavedEvents(
    _root: undefined,
    _params: undefined,
    { models, cpUser }: IContext,
  ) {
    return models.SavedEvents.listSavedEvents(cpUser._id);
  },
};

markResolvers(eventClientPortalQueries, {
  wrapperConfig: { forClientPortal: true, cpUserRequired: true },
});
