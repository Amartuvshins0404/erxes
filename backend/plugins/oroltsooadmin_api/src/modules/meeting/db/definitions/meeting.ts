import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

import {
  IMeetingDocument,
  IMeetingRequester,
} from '@/meeting/@types/meeting';
import { MEETING_SOURCES, MEETING_STATUSES } from '~/constants';

const requesterSchema = new Schema<IMeetingRequester>(
  {
    cpUserId: { type: String, required: true, label: 'Client portal user id' },
    name: { type: String, label: 'Requester name' },
    email: { type: String, label: 'Requester email' },
    phone: { type: String, label: 'Requester phone' },
  },
  { _id: false },
);

export const meetingSchema = new Schema<IMeetingDocument>(
  {
    _id: mongooseStringRandomId,

    subdomain: {
      type: String,
      required: true,
      index: true,
      label: 'Subdomain',
    },

    title: { type: String, required: true, label: 'Title' },
    location: { type: String, label: 'Location' },
    scheduledAt: { type: Date, label: 'Scheduled at' },
    note: { type: String, label: 'Note' },
    status: {
      type: String,
      enum: MEETING_STATUSES.ALL,
      default: MEETING_STATUSES.PLANNED,
      label: 'Status',
    },
    source: {
      type: String,
      enum: MEETING_SOURCES.ALL,
      default: MEETING_SOURCES.ADMIN,
      label: 'Source',
    },
    requestedBy: { type: requesterSchema, label: 'Requested by' },
  },
  { timestamps: true },
);

meetingSchema.index({ subdomain: 1, scheduledAt: -1 });
meetingSchema.index({ status: 1, scheduledAt: -1 });
meetingSchema.index({ 'requestedBy.cpUserId': 1, createdAt: -1 });
