import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import { IMeetingDocument } from '@/meeting/@types/meeting';
import { meetingSchema } from '@/meeting/db/definitions/meeting';
import { IModels } from '~/connectionResolvers';

export interface IMeetingModel extends Model<IMeetingDocument> {
  getMeeting(_id: string): Promise<IMeetingDocument>;
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
  }

  meetingSchema.loadClass(Meeting);

  return meetingSchema;
};
