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
    projectId: { type: String, index: true },
    unit: { type: Schema.Types.ObjectId, index: true },
    index: { type: Number, required: true },
    label: { type: String },
    dueDate: { type: Date, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'MNT' },
    status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'cancelled'],
      default: 'unpaid',
      index: true,
    },
    paidAmount: { type: Number, default: 0 },
    paidDate: { type: Date, index: true },
    note: { type: String },
    penaltyAmount: { type: Number, default: 0 },
    overdueDays: { type: Number, default: 0 },
  },
  { timestamps: true },
);
