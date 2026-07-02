import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

const REGISTRATION_APPLICATION_STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
] as const;

const REGISTRATION_PAYMENT_STATUSES = [
  'unpaid',
  'paid',
  'manual_verified',
] as const;

export const registrationApplicationSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    createdAt: { type: Date, label: 'Created at', index: true },
    modifiedAt: { type: Date, label: 'Modified at' },

    subdomain: {
      type: String,
      required: true,
      label: 'Subdomain',
      index: true,
    },
    membershipTypeId: {
      type: String,
      required: true,
      label: 'Membership type',
      index: true,
    },
    schemaVersion: {
      type: String,
      required: true,
      label: 'Schema version',
      index: true,
    },
    status: {
      type: String,
      enum: [...REGISTRATION_APPLICATION_STATUSES],
      required: true,
      default: 'submitted',
      label: 'Status',
    },
    answers: {
      type: Schema.Types.Mixed,
      required: true,
      label: 'Answers',
    },
    instanceId: { type: String, label: 'Instance ID', index: true },
    cpUserId: {
      type: String,
      label: 'Client portal user',
      sparse: true,
      index: true,
    },
    isRead: {
      type: Boolean,
      label: 'Is read',
      default: false,
      index: true,
    },
    invoiceId: {
      type: String,
      label: 'Invoice ID',
      sparse: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: [...REGISTRATION_PAYMENT_STATUSES],
      default: 'unpaid',
      label: 'Payment status',
      index: true,
    },
    membershipFeeAmount: {
      type: Number,
      label: 'Membership fee amount',
    },
  },
  {
    timestamps: true,
  },
);

registrationApplicationSchema.index({ subdomain: 1, membershipTypeId: 1 });
registrationApplicationSchema.index({ subdomain: 1, createdAt: -1 });
registrationApplicationSchema.index({ subdomain: 1, cpUserId: 1 });
