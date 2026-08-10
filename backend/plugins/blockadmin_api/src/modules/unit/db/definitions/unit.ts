import { Schema, Types } from 'mongoose';
import { schemaWrapper } from '~/utils';

export const unitSchema = schemaWrapper(
  new Schema(
    {
      zoning: { type: Types.ObjectId, ref: 'block_zonings' },
      number: { type: String },
      status: { type: String },
      type: { type: Types.ObjectId, ref: 'block_unit_types' },
      isFeatured: { type: Boolean },
      blockSubdomain: { type: String, index: true },
      blockEntityId: { type: Types.ObjectId, index: true },
      agencySubdomain: { type: String, index: true },
      agencyEntityId: { type: Types.ObjectId, index: true },
      locked: { type: Boolean, default: false },
    },
    {
      timestamps: true,
    },
  ),
);
