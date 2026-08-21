import { ContractAmountType, ContractStatus } from '@/contract/@types/contract';
import { Schema } from 'mongoose';

import {
  BlockProjectPaymentPlanFrequency,
  BlockProjectPaymentPlanInterestType,
} from '@/project/@types/payment';
import { schemaWrapper } from '~/utils';

const contractPaymentPlanSchema = new Schema(
  {
    downPaymentPercentage: { type: Number },
    downPaymentAmount: { type: Number },
    barterPercentage: { type: Number },
    barterAmount: { type: Number },
    description: { type: String },
    interestPercentage: { type: Number },
    interestType: {
      type: String,
      enum: Object.values(BlockProjectPaymentPlanInterestType),
    },
    completionPaymentPercentage: { type: Number },
    completionPaymentAmount: { type: Number },
    discountPercentage: { type: Number },
    installment: { type: Number },
    frequency: {
      type: String,
      enum: Object.values(BlockProjectPaymentPlanFrequency),
    },
    penaltyPercentage: { type: Number },
    vatIncluded: { type: Boolean },
    roundedInstallmentAmount: { type: Number },
    installmentAmounts: { type: [Number] },
    paymentDates: { type: [Number] },
    paymentDueDates: { type: [Date] },
    firstPaymentDate: { type: Date },
    downPaymentDate: { type: Date },
    completionPaymentDate: { type: Date },
    completionPaymentDateLabel: { type: String },
  },
  { _id: false },
);

export const contractSchema = schemaWrapper(
  new Schema(
    {
      number: { type: String, required: true },
      currency: { type: String, required: true },
      unit: {
        type: Schema.Types.ObjectId,
        ref: 'block_admin_units',
        required: true,
      },
      date: { type: Date, required: true },
      amount: { type: Number, required: true },
      amountType: { type: String, enum: Object.values(ContractAmountType) },
      status: {
        type: String,
        enum: Object.values(ContractStatus),
        default: ContractStatus.DRAFT,
      },
      isLifeTime: { type: Boolean, default: false },
      description: { type: String },
      paymentPlan: { type: contractPaymentPlanSchema },
      paymentDates: { type: [Number] },
      user: { type: String },
      customerId: { type: String, required: true },
      signedAt: { type: Date },
    },
    { timestamps: true },
  ),
);
