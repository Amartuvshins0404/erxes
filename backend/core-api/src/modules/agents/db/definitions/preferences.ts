import { Schema } from 'mongoose';

export const agentsUserPreferencesSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    defaultConnectionId: { type: String },
  },
  { timestamps: true },
);
