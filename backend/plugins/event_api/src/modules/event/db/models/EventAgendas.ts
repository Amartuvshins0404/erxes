import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { eventAgendaSchema } from '@/event/db/definitions/event';
import { IEventAgendaDocument, IEventAgendaItem } from '@/event/@types/event';

export interface IEventAgendaModel extends Model<IEventAgendaDocument> {
  listByEventId(eventId: string): Promise<IEventAgendaDocument[]>;
  replaceForEvent(
    eventId: string,
    agenda?: IEventAgendaItem[],
  ): Promise<void>;
  removeForEvents(eventIds: string[]): Promise<{ deletedCount?: number }>;
}

export const loadEventAgendaClass = (models: IModels) => {
  class EventAgenda {
    public static async listByEventId(eventId: string) {
      return models.EventAgendas.find({ eventId }).sort({ startTime: 1 });
    }

    public static async replaceForEvent(
      eventId: string,
      agenda?: IEventAgendaItem[],
    ) {
      await models.EventAgendas.deleteMany({ eventId });

      if (!agenda?.length) {
        return;
      }

      await models.EventAgendas.insertMany(
        agenda.map((item) => ({ ...item, eventId })),
      );
    }

    public static async removeForEvents(eventIds: string[]) {
      return models.EventAgendas.deleteMany({ eventId: { $in: eventIds } });
    }
  }

  eventAgendaSchema.loadClass(EventAgenda);

  return eventAgendaSchema;
};
