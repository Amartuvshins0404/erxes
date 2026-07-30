import { Schema } from 'mongoose';
import { ContractPartyType } from '@/contract/@types/contract';

import {
  BlockProjectPaymentPlanFrequency,
  BlockProjectPaymentPlanInterestType,
} from '@/project/@types/payment';

const contractPartySchema = new Schema(
  {
    type: {
      type: String,
      enum: Object.values(ContractPartyType),
      required: true,
    },
    id: { type: String, required: true },
  },
  { _id: false },
);

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

export const contractSchema = new Schema(
  {
    number: { type: String, required: true },
    currency: { type: String, required: true },
    unit: { type: Schema.Types.ObjectId, ref: 'block_units', required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: {
      type: Schema.Types.ObjectId,
      ref: 'block_contract_statuses',
      index: true,
    },
    party: { type: contractPartySchema, required: true },
    description: { type: String },
    paymentPlan: { type: contractPaymentPlanSchema, required: true },
    user: { type: String },
  },
  { timestamps: true },
);
