import { Schema } from 'mongoose';
import { IContractPaymentSettingsDocument } from '@/contract/@types/paymentSettings';

export const contractPaymentSettingsSchema =
  new Schema<IContractPaymentSettingsDocument>(
    {
      projectId: { type: String, default: null, index: true },
      paymentIds: { type: [String], default: [] },
      allowPartial: { type: Boolean, default: false },
    },
    { timestamps: true },
  );
