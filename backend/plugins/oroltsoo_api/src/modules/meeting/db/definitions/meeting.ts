import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

import { IMeetingDocument } from '@/meeting/@types/meeting';
import { MEETING_STATUSES } from '~/constants';

export const meetingSchema = new Schema<IMeetingDocument>(
  {
    _id: mongooseStringRandomId,

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
  },
  { timestamps: true },
);

meetingSchema.index({ scheduledAt: -1 });
meetingSchema.index({ status: 1, scheduledAt: -1 });
