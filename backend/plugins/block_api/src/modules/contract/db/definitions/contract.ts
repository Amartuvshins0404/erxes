import { Schema } from 'mongoose';
import {
  ContractPartyType,
  ContractAmountType,
} from '@/contract/@types/contract';

import {
  BlockProjectPaymentPlanFrequency,
  BlockProjectPaymentPlanType,
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
    description: { type: String },
    interestPercentage: { type: Number },
    interestType: {
      type: String,
      enum: Object.values(BlockProjectPaymentPlanInterestType),
    },
    advancePaymentPercentage: { type: Number },
    discountPercentage: { type: Number },
    installment: { type: Number },
    frequency: {
      type: String,
      enum: Object.values(BlockProjectPaymentPlanFrequency),
    },
    penaltyPercentage: { type: Number },
    vatIncluded: { type: Boolean },
    type: { type: String, enum: Object.values(BlockProjectPaymentPlanType) },
    paymentDates: { type: [Number] },
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
    amountType: { type: String, enum: Object.values(ContractAmountType) },
    status: {
      type: Schema.Types.ObjectId,
      ref: 'block_contract_statuses',
      index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    isLifeTime: { type: Boolean, default: false },
    party: { type: contractPartySchema, required: true },
    description: { type: String },
    paymentPlan: { type: contractPaymentPlanSchema, required: true },
    paymentDates: { type: [Number] },
    user: { type: String },
  },
  { timestamps: true },
);
