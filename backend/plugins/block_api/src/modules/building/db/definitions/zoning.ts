import { Schema, Types } from 'mongoose';

export const zoningSchema = new Schema(
  {
    building: { type: Types.ObjectId, ref: 'block_buildings' },
    floor: { type: Number },
    usageTypes: { type: [String] },
    areaType: { type: String },
    tenureTypes: { type: [String] },
    size: { type: Number },
  },
  { timestamps: true },
);
