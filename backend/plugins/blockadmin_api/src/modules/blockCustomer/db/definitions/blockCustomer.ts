import { Schema } from 'mongoose';
import { schemaWrapper } from '~/utils';

export const customerSchema = schemaWrapper(
  new Schema(
    {
      customerId: { type: String, required: true, index: true },
      firstName: { type: String },
      lastName: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    { timestamps: true },
  ),
);
