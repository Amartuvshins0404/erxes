import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';
import { ProviderStatus } from '@/provider/@types/provider';

const contactInfoSchema = new Schema(
  {
    phone: { type: String, required: true, label: 'Phone' },
    email: { type: String, required: true, label: 'Email' },
    website: { type: String, label: 'Website' },
  },
  { _id: false },
);

export const providerSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    createdAt: { type: Date, label: 'Created at', index: true },
    modifiedAt: { type: Date, label: 'Modified at' },

    businessName: {
      type: Schema.Types.Mixed,
      required: true,
      label: 'Business Name',
      validate: {
        validator: function (v: any) {
          return (
            v &&
            typeof v === 'object' &&
            typeof v.en === 'string' &&
            typeof v.mn === 'string' &&
            v.en !== undefined &&
            v.mn !== undefined
          );
        },
        message: 'Business name must have both en and mn properties as strings',
      },
    },
    description: {
      type: Schema.Types.Mixed,
      label: 'Description',
      validate: {
        validator: function (v: any) {
          if (!v) return true;
          return (
            typeof v === 'object' &&
            (typeof v.en === 'string' || typeof v.mn === 'string')
          );
        },
        message: 'Description must be an object with en and/or mn properties',
      },
    },
    contactInfo: {
      type: contactInfoSchema,
      required: true,
      label: 'Contact Info',
    },
    facilities: { type: [String], label: 'Facilities' },
    associationIds: { type: [String], required: true, label: 'Association IDs' },
    singleProviderLimit: {
      type: Number,
      label: 'Single Provider Limit',
      default: 5,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(ProviderStatus),
      required: true,
      default: ProviderStatus.PENDING,
      label: 'Status',
    },
    rejectionReason: { type: String, label: 'Rejection Reason' },
    approvedAt: { type: Date, label: 'Approved At' },
    approvedBy: { type: String, label: 'Approved By' },
    rejectedBy: { type: String, label: 'Rejected By' },
    isActive: { type: Boolean, default: true, label: 'Is Active' },
    icon: { type: String, label: 'Icon URL', optional: true },
    coverImages: { type: [String], label: 'Cover Images', optional: true },
    instanceId: { type: String, label: 'Instance ID', index: true },
  },
  {
    timestamps: true,
  },
);

providerSchema.index({ status: 1 });
providerSchema.index({ associationIds: 1 });
providerSchema.index({ status: 1, isActive: 1 });
providerSchema.index({ instanceId: 1 });
