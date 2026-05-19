import { Schema } from 'mongoose';

export const contractPaymentSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contractNumber: { type: String },
    partyId: { type: String, index: true },
    partyType: { type: String },
    projectId: { type: Schema.Types.ObjectId, index: true },
    unit: { type: Schema.Types.ObjectId, index: true },
    index: { type: Number, required: true },
    label: { type: String },
    dueDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'MNT' },
    paid: { type: Boolean, default: false, index: true },
    paidAmount: { type: Number },
    paidDate: { type: Date, index: true },
    note: { type: String },
  },
  { timestamps: true },
);
