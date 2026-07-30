import { Schema, Types } from 'mongoose';

import {
  BlockProjectPaymentPlanFrequency,
  BlockProjectPaymentPlanInterestType,
  BlockProjectPaymentPlanType,
} from '@/project/@types/payment';

export const paymentPlanSchema = new Schema(
  {
    name: { type: String },
    project: {
      type: Types.ObjectId,
      ref: 'block_projects',
      required: true,
    },
    downPaymentPercentage: { type: Number },
    interestPercentage: { type: Number },
    completionPaymentPercentage: { type: Number },
    discountPercentage: { type: Number },

    description: { type: String },
    type: { type: String, enum: Object.values(BlockProjectPaymentPlanType) },
    installment: { type: Number },
    frequency: {
      type: String,
      enum: Object.values(BlockProjectPaymentPlanFrequency),
    },
    interestType: {
      type: String,
      enum: Object.values(BlockProjectPaymentPlanInterestType),
    },
    penaltyPercentage: { type: Number },
    vatIncluded: { type: Boolean },
  },
  {
    timestamps: true,
  },
);
