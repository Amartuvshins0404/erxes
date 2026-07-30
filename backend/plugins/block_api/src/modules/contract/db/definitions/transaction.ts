import { Schema } from 'mongoose';

export const contractPaymentTransactionSchema = new Schema(
  {
    paymentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contractId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    date: { type: Date, required: true, index: true },
    note: { type: String },
    createdBy: { type: String },
    paymentMethod: { type: String },
  },
  { timestamps: true },
);
