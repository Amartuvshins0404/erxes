import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import {
  IMeetingDocument,
  IMeetingSyncInput,
} from '@/meeting/@types/meeting';
import { meetingSchema } from '@/meeting/db/definitions/meeting';
import { IModels } from '~/connectionResolvers';

export interface IMeetingModel extends Model<IMeetingDocument> {
  getMeeting(_id: string): Promise<IMeetingDocument>;
  syncMeeting(
    entityId: string,
    input: IMeetingSyncInput,
  ): Promise<IMeetingDocument | null>;
  removeSyncedMeeting(entityId: string): Promise<{ deletedCount?: number }>;
}

export const loadMeetingClass = (models: IModels) => {
  class Meeting {
    public static async getMeeting(_id: string) {
      const meeting = await models.Meeting.findOne({ _id }).lean();

      if (!meeting) {
        throw new ExpectedError('Уулзалт олдсонгүй', 'NOT_FOUND');
      }

      return meeting;
    }

    public static async syncMeeting(
      entityId: string,
      input: IMeetingSyncInput,
    ) {
      if (!input?.title) {
        throw new ExpectedError(
          'title is required in the sync payload',
          'BAD_USER_INPUT',
        );
      }

      return models.Meeting.findOneAndUpdate(
        { entityId },
        { $set: { ...input }, $setOnInsert: { entityId } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async removeSyncedMeeting(entityId: string) {
      return models.Meeting.deleteOne({ entityId });
    }
  }

  meetingSchema.loadClass(Meeting);

  return meetingSchema;
};
