import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { savedEventSchema } from '@/event/db/definitions/event';
import { IEventDocument, ISavedEventDocument } from '@/event/@types/event';

export interface ISavedEventModel extends Model<ISavedEventDocument> {
  toggleSave(cpUserId: string, eventId: string): Promise<{ saved: boolean }>;
  listSavedEvents(cpUserId: string): Promise<IEventDocument[]>;
}

export const loadSavedEventClass = (models: IModels) => {
  class SavedEvent {
    public static async toggleSave(cpUserId: string, eventId: string) {
      await models.Events.getEvent(eventId);

      const existing = await models.SavedEvents.findOne({ cpUserId, eventId });

      if (existing) {
        await models.SavedEvents.deleteOne({ _id: existing._id });
        return { saved: false };
      }

      await models.SavedEvents.create({ cpUserId, eventId });

      return { saved: true };
    }

    public static async listSavedEvents(cpUserId: string) {
      const eventIds = await models.SavedEvents.find({ cpUserId }).distinct(
        'eventId',
      );

      return models.Events.find({ _id: { $in: eventIds } }).sort({
        startDate: -1,
      });
    }
  }

  savedEventSchema.loadClass(SavedEvent);

  return savedEventSchema;
};
