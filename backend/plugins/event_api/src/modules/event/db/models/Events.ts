import {
  ICursorPaginateParams,
  ICursorPaginateResult,
} from 'erxes-api-shared/core-types';
import { cursorPaginate } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { EventStatus, EventTab } from '@/event/constants';
import { eventSchema } from '@/event/db/definitions/event';
import {
  CpEventQueryParams,
  EventQueryParams,
  IEventDocument,
  IEventInput,
} from '@/event/@types/event';
import {
  generateFilter,
  validateAgenda,
  validateEventDates,
} from '@/event/utils';
import { InvitationStatus } from '@/invitation/constants';

export interface IEventModel extends Model<IEventDocument> {
  getEvent(_id: string): Promise<IEventDocument>;
  listEvents(
    params: EventQueryParams & ICursorPaginateParams,
  ): Promise<ICursorPaginateResult<IEventDocument>>;
  listEventsForCpUser(
    params: CpEventQueryParams & ICursorPaginateParams,
  ): Promise<ICursorPaginateResult<IEventDocument>>;
  createEvent(doc: IEventInput, createdBy?: string): Promise<IEventDocument>;
  updateEvent(
    _id: string,
    doc: Partial<IEventInput>,
  ): Promise<IEventDocument>;
  removeEvents(_ids: string[]): Promise<{ deletedCount?: number }>;
}

export const loadEventClass = (models: IModels) => {
  class Event {
    public static async getEvent(_id: string) {
      const event = await models.Events.findOne({ _id });

      if (!event) {
        throw new Error('Event not found');
      }

      return event;
    }

    public static async listEvents(
      params: EventQueryParams & ICursorPaginateParams,
    ) {
      return cursorPaginate<IEventDocument>({
        model: models.Events,
        params,
        query: generateFilter(params),
      });
    }

    public static async listEventsForCpUser(
      params: CpEventQueryParams & ICursorPaginateParams,
    ) {
      const { cpUserId, tab } = params;

      const query = generateFilter(params);
      query.status = EventStatus.PUBLISHED;

      if (tab === EventTab.INVITED || tab === EventTab.JOINED) {
        const invitationQuery: Record<string, unknown> = { cpUserId };

        if (tab === EventTab.JOINED) {
          invitationQuery.status = InvitationStatus.GOING;
        }

        const eventIds = await models.Invitations.find(invitationQuery).distinct(
          'eventId',
        );

        query._id = query._id
          ? { $in: (query._id.$in as string[]).filter((id) => eventIds.includes(id)) }
          : { $in: eventIds };
      }

      return cursorPaginate<IEventDocument>({
        model: models.Events,
        params,
        query,
      });
    }

    public static async createEvent(doc: IEventInput, createdBy?: string) {
      const { agenda, ...eventDoc } = doc;

      validateEventDates(eventDoc.startDate, eventDoc.endDate);
      validateAgenda(agenda);

      const created = await models.Events.create({ ...eventDoc, createdBy });

      await models.EventAgendas.replaceForEvent(created._id, agenda);

      return created;
    }

    public static async updateEvent(
      _id: string,
      doc: Partial<IEventInput>,
    ) {
      const { agenda, ...eventDoc } = doc;
      const existing = await models.Events.getEvent(_id);

      validateEventDates(
        eventDoc.startDate ?? existing.startDate,
        eventDoc.endDate ?? existing.endDate,
      );

      if (agenda !== undefined) {
        validateAgenda(agenda);

        await models.EventAgendas.replaceForEvent(_id, agenda);
      }

      const updated = await models.Events.findOneAndUpdate(
        { _id },
        { $set: eventDoc },
        { new: true },
      );

      if (!updated) {
        throw new Error('Event not found');
      }

      return updated;
    }

    public static async removeEvents(_ids: string[]) {
      await models.Invitations.deleteMany({ eventId: { $in: _ids } });
      await models.SavedEvents.deleteMany({ eventId: { $in: _ids } });
      await models.EventAgendas.removeForEvents(_ids);

      return models.Events.deleteMany({ _id: { $in: _ids } });
    }
  }

  eventSchema.loadClass(Event);

  return eventSchema;
};
