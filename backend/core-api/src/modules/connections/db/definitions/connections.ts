import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

export const CONNECTION_SCOPES = ['workspace', 'personal'] as const;

export const connectionSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    type: { type: String, required: true, index: true },
    name: { type: String, required: true },
    scope: { type: String, enum: CONNECTION_SCOPES, required: true },
    ownerId: { type: String },
    config: { type: Object, default: {} },
    secrets: { type: Object, default: {} },
    services: { type: [String], default: [] },
    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true, minimize: false },
);

connectionSchema.index({ scope: 1, ownerId: 1, createdAt: 1 });
