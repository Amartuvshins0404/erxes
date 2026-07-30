import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { IMushopMembershipDocument } from '@/membership/@types/mushopMembership';
import { MEMBERSHIP_STATUS } from '~/constants';

export const mushopMembershipSchema =
  new Schema<IMushopMembershipDocument>(
    {
      _id: mongooseStringRandomId,
      customerId: { type: String, required: true, index: true },
      planId: { type: String, index: true },
      status: {
        type: String,
        enum: MEMBERSHIP_STATUS.ALL,
        default: MEMBERSHIP_STATUS.ACTIVE,
      },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      amount: { type: Number },
      currency: { type: String, default: 'MNT' },
      invoiceId: { type: String },
    },
    { timestamps: true },
  );
