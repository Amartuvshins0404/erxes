import { EventStatus, IEvent, IEventDocument } from '@/event/@types/event';
import { validateEventCategories } from '@/event/utils/validateEventCategories';
import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { eventSchema } from '../definitions/event';

export interface IEventModel extends Model<IEventDocument> {
  createEvent(doc: IEvent): Promise<IEventDocument>;
  updateEvent(_id: string, doc: Partial<IEvent>): Promise<IEventDocument>;
  removeEvents(ids: string[]): Promise<{ n: number; ok: number }>;
}

const validateEventDates = (startDate: Date, endDate: Date) => {
  if (new Date(endDate) < new Date(startDate)) {
    throw new Error('End date must be on or after start date');
  }
};

export const loadEventClass = (models: IModels) => {
  class Event {
    public static async createEvent(doc: IEvent) {
      validateEventDates(doc.startDate, doc.endDate);

      const categories = await validateEventCategories(models, doc.categoryIds);

      return await models.Event.create({
        ...doc,
        categoryIds: categories.categoryIds,
        status: doc.status ?? EventStatus.DRAFT,
        isActive: doc.isActive ?? true,
        createdAt: new Date(),
      });
    }

    public static async updateEvent(_id: string, doc: Partial<IEvent>) {
      const existing = await models.Event.findOne({ _id });

      if (!existing) {
        throw new Error('Event not found');
      }

      const startDate = doc.startDate ?? existing.startDate;
      const endDate = doc.endDate ?? existing.endDate;

      validateEventDates(startDate, endDate);

      const categoryIds =
        doc.categoryIds !== undefined ? doc.categoryIds : existing.categoryIds;

      const categories = await validateEventCategories(models, categoryIds);

      const { categoryIds: _categoryIds, ...updateDoc } = doc;

      return await models.Event.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...updateDoc,
            categoryIds: categories.categoryIds,
            modifiedAt: new Date(),
          },
          $unset: {
            mainCategoryId: '',
            subCategoryId: '',
            mainCategoryIds: '',
            subCategoryIds: '',
          },
        },
        { new: true },
      );
    }

    public static async removeEvents(ids: string[]) {
      return models.Event.deleteMany({ _id: { $in: ids } });
    }
  }

  eventSchema.loadClass(Event);

  return eventSchema;
};
