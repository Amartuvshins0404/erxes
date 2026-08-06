import { Schema } from 'mongoose';
import { schemaWrapper } from '~/utils';

export const customerSchema = schemaWrapper(
  new Schema(
    {
      customerId: { type: String, required: true, index: true },
    },
    { timestamps: true },
  ),
  { entityIdType: String },
);
