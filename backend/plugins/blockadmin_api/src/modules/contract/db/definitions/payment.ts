import { Schema } from 'mongoose';
import { schemaWrapper } from '~/utils';

export const contractPaymentSchema = schemaWrapper(
  new Schema(
    {
      contractId: { type: String, required: true, index: true },
      contractNumber: { type: String },
      customerId: { type: String, index: true },
      index: { type: Number, required: true },
      label: { type: String },
      dueDate: { type: Date },
      amount: { type: Number, required: true },
      currency: { type: String },
      status: {
        type: String,
        enum: ['unpaid', 'partial', 'paid', 'cancelled'],
        default: 'unpaid',
      },
      paidAmount: { type: Number, default: 0 },
      paidDate: { type: Date },
      note: { type: String },
    },
    { timestamps: true },
  ),
);
