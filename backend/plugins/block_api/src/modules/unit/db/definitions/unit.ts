import { Schema, Types } from 'mongoose';

export const unitSchema = new Schema(
  {
    zoning: { type: Types.ObjectId, ref: 'block_zonings' },
    number: { type: String },
    status: { type: String },
    type: { type: Types.ObjectId, ref: 'block_unit_types' },
    blockSubdomain: { type: String, index: true },
    blockEntityId: { type: String, index: true },
    agencySubdomain: { type: String, index: true },
    agencyEntityId: { type: String, index: true },
    locked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);
