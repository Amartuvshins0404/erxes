import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';
import { InvitationSource, InvitationStatus } from '@/invitation/constants';
import { IEventInvitationDocument } from '@/invitation/@types/invitation';

export const invitationSchema = new Schema<IEventInvitationDocument>(
  {
    _id: mongooseStringRandomId,
    eventId: { type: String, required: true, label: 'Event' },
    customerId: { type: String, required: true, label: 'Client portal user' },
    status: {
      type: String,
      enum: Object.values(InvitationStatus),
      default: InvitationStatus.PENDING,
      label: 'Status',
    },
    source: {
      type: String,
      enum: Object.values(InvitationSource),
      default: InvitationSource.SELF,
      label: 'Source',
    },
    respondedAt: { type: Date, label: 'Responded at' },
    message: { type: String, label: 'Message' },
    sentAt: { type: Date, label: 'Sent at' },
    sentBy: { type: String, label: 'Sent by' },
  },
  { timestamps: true },
);

invitationSchema.index({ eventId: 1, customerId: 1 }, { unique: true });
invitationSchema.index({ customerId: 1, status: 1 });
invitationSchema.index({ eventId: 1, status: 1 });
