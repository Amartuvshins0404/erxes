import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import {
  IMeetingDocument,
  IMeetingInput,
} from '@/meeting/@types/meeting';
import { meetingSchema } from '@/meeting/db/definitions/meeting';
import { IModels } from '~/connectionResolvers';
import { MEETING_STATUSES } from '~/constants';

export interface IMeetingModel extends Model<IMeetingDocument> {
  getMeeting(_id: string): Promise<IMeetingDocument>;
  createMeeting(
    subdomain: string,
    doc: IMeetingInput,
  ): Promise<IMeetingDocument>;
  updateMeeting(
    _id: string,
    doc: IMeetingInput,
  ): Promise<IMeetingDocument | null>;
  removeMeetings(_ids: string[]): Promise<{
    deletedCount: number;
    meetings: IMeetingDocument[];
  }>;
}

const trim = (value?: string) => (value ?? '').trim();

const normalize = (doc: IMeetingInput) => {
  const title = trim(doc.title);

  if (!title) {
    throw new ExpectedError('Уулзалтын гарчгийг оруулна уу', 'BAD_USER_INPUT');
  }

  return {
    title,
    location: trim(doc.location),
    note: trim(doc.note),
    scheduledAt: doc.scheduledAt ? new Date(doc.scheduledAt) : null,
    status:
      doc.status && MEETING_STATUSES.ALL.includes(doc.status)
        ? doc.status
        : MEETING_STATUSES.PLANNED,
  };
};

export const loadMeetingClass = (models: IModels) => {
  class Meeting {
    public static async getMeeting(_id: string) {
      const meeting = await models.Meeting.findOne({ _id }).lean();

      if (!meeting) {
        throw new ExpectedError('Уулзалт олдсонгүй', 'NOT_FOUND');
      }

      return meeting;
    }

    public static async createMeeting(subdomain: string, doc: IMeetingInput) {
      const tenant = trim(subdomain);

      if (!tenant) {
        throw new ExpectedError('Байгууллагыг сонгоно уу', 'BAD_USER_INPUT');
      }

      const profile = await models.Profile.findOne({ subdomain: tenant })
        .select('_id')
        .lean();

      if (!profile) {
        throw new ExpectedError(
          `"${tenant}" байгууллагын профайл олдсонгүй`,
          'BAD_USER_INPUT',
        );
      }

      return models.Meeting.create({ ...normalize(doc), subdomain: tenant });
    }

    public static async updateMeeting(_id: string, doc: IMeetingInput) {
      await models.Meeting.getMeeting(_id);

      return models.Meeting.findOneAndUpdate(
        { _id },
        { $set: normalize(doc) },
        { new: true },
      );
    }

    public static async removeMeetings(_ids: string[]) {
      if (!_ids?.length) {
        throw new ExpectedError('Устгах уулзалтаа сонгоно уу', 'BAD_USER_INPUT');
      }

      const meetings = await models.Meeting.find({ _id: { $in: _ids } }).lean();

      const { deletedCount } = await models.Meeting.deleteMany({
        _id: { $in: _ids },
      });

      return { deletedCount: deletedCount ?? 0, meetings };
    }
  }

  meetingSchema.loadClass(Meeting);

  return meetingSchema;
};
