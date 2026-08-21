import { Schema } from 'mongoose';

export const customerSyncSchema = new Schema(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    blockAdminId: { type: String, required: true },
  },
  { timestamps: true },
);
