import { Resolver } from 'erxes-api-shared/core-types';
import { markResolvers } from 'erxes-api-shared/utils';
import { IContext } from '~/connectionResolvers';
import { IEventInput } from '@/event/@types/event';
import { refreshEventKnowledgeSource } from '@/event/meta/automations';

export const eventMutations: Record<string, Resolver> = {
  async eventsAdd(
    _root: undefined,
    { doc }: { doc: IEventInput },
    { models, user, subdomain }: IContext,
  ) {
    const event = await models.Events.createEvent(doc, user._id);

    await refreshEventKnowledgeSource({ subdomain, eventId: event._id });

    return event;
  },

  async eventsEdit(
    _root: undefined,
    { _id, doc }: { _id: string; doc: IEventInput },
    { models, subdomain }: IContext,
  ) {
    const event = await models.Events.updateEvent(_id, doc);

    await refreshEventKnowledgeSource({ subdomain, eventId: _id });

    return event;
  },

  async eventsRemove(
    _root: undefined,
    { _ids }: { _ids: string[] },
    { models, subdomain }: IContext,
  ) {
    const result = await models.Events.removeEvents(_ids);

    await Promise.all(
      _ids.map((eventId) =>
        refreshEventKnowledgeSource({ subdomain, eventId }),
      ),
    );

    return result;
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
