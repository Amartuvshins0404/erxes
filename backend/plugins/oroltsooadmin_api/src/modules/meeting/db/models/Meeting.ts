import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import {
  ICpMeetingUser,
  IMeetingDocument,
  IMeetingInput,
  IMeetingRequestInput,
} from '@/meeting/@types/meeting';
import { meetingSchema } from '@/meeting/db/definitions/meeting';
import { IModels } from '~/connectionResolvers';
import {
  MEETING_REQUEST_PENDING_LIMIT,
  MEETING_SOURCES,
  MEETING_STATUSES,
  PROFILE_STATUSES,
} from '~/constants';

export interface IMeetingModel extends Model<IMeetingDocument> {
  getMeeting(_id: string): Promise<IMeetingDocument>;
  createMeeting(
    subdomain: string,
    doc: IMeetingInput,
  ): Promise<IMeetingDocument>;
  createMeetingRequest(
    cpUser: ICpMeetingUser,
    doc: IMeetingRequestInput,
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

const normalize = (
  doc: IMeetingInput,
  fallbackStatus = MEETING_STATUSES.PLANNED,
) => {
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
      doc.status && MEETING_STATUSES.ADMIN_ALL.includes(doc.status)
        ? doc.status
        : fallbackStatus,
  };
};

const normalizeRequest = (doc: IMeetingRequestInput) => {
  const title = trim(doc.title);

  if (!title) {
    throw new ExpectedError('Уулзалтын сэдвээ оруулна уу', 'BAD_USER_INPUT');
  }

  if (!doc.scheduledAt) {
    throw new ExpectedError('Уулзах огноогоо сонгоно уу', 'BAD_USER_INPUT');
  }

  const scheduledAt = new Date(doc.scheduledAt);

  if (Number.isNaN(scheduledAt.getTime())) {
    throw new ExpectedError('Огноо буруу байна', 'BAD_USER_INPUT');
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw new ExpectedError('Ирээдүйн огноо сонгоно уу', 'BAD_USER_INPUT');
  }

  return {
    title,
    location: trim(doc.location),
    note: trim(doc.note),
    scheduledAt,
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

      return models.Meeting.create({
        ...normalize(doc),
        subdomain: tenant,
        source: MEETING_SOURCES.ADMIN,
      });
    }

    public static async createMeetingRequest(
      cpUser: ICpMeetingUser,
      doc: IMeetingRequestInput,
    ) {
      const cpUserId = trim(cpUser?._id);

      if (!cpUserId) {
        throw new ExpectedError('Нэвтэрч орно уу', 'UNAUTHORIZED');
      }

      const tenant = trim(doc.subdomain);

      if (!tenant) {
        throw new ExpectedError('Уулзах хүнээ сонгоно уу', 'BAD_USER_INPUT');
      }

      const profile = await models.Profile.findOne({
        subdomain: tenant,
        status: PROFILE_STATUSES.PUBLISHED,
      })
        .select('_id')
        .lean();

      if (!profile) {
        throw new ExpectedError('Профайл олдсонгүй', 'NOT_FOUND');
      }

      const normalized = normalizeRequest(doc);

      const duplicate = await models.Meeting.findOne({
        subdomain: tenant,
        status: MEETING_STATUSES.REQUESTED,
        'requestedBy.cpUserId': cpUserId,
        scheduledAt: normalized.scheduledAt,
      })
        .select('_id')
        .lean();

      if (duplicate) {
        throw new ExpectedError(
          'Энэ цагт илгээсэн хүсэлт бүртгэлтэй байна',
          'BAD_USER_INPUT',
        );
      }

      const pendingCount = await models.Meeting.countDocuments({
        subdomain: tenant,
        status: MEETING_STATUSES.REQUESTED,
        'requestedBy.cpUserId': cpUserId,
      });

      if (pendingCount >= MEETING_REQUEST_PENDING_LIMIT) {
        throw new ExpectedError(
          `Хүлээгдэж буй хүсэлт ${MEETING_REQUEST_PENDING_LIMIT}-аас хэтэрсэн байна`,
          'BAD_USER_INPUT',
        );
      }

      const fullName = trim(
        [cpUser?.firstName, cpUser?.lastName].filter(Boolean).join(' '),
      );

      return models.Meeting.create({
        ...normalized,
        subdomain: tenant,
        status: MEETING_STATUSES.REQUESTED,
        source: MEETING_SOURCES.CLIENT_PORTAL,
        requestedBy: {
          cpUserId,
          name: trim(doc.contactName) || fullName,
          email: trim(doc.contactEmail) || trim(cpUser?.email),
          phone: trim(doc.contactPhone) || trim(cpUser?.phone),
        },
      });
    }

    public static async updateMeeting(_id: string, doc: IMeetingInput) {
      const meeting = await models.Meeting.getMeeting(_id);

      return models.Meeting.findOneAndUpdate(
        { _id },
        { $set: normalize(doc, meeting.status) },
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
