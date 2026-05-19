import { Schema } from 'mongoose';

export const contractStatusSchema = new Schema(
  {
    name: { type: String, label: 'Name', required: true },
    description: { type: String, label: 'Description' },
    color: { type: String, label: 'Color', required: true },
    type: { type: String, label: 'Type', index: 1 },
    projectId: {
      type: Schema.Types.ObjectId,
      label: 'Project ID',
      required: true,
      index: true,
    },
    order: { type: Number, label: 'Order', index: true },
  },
  {
    timestamps: true,
  },
);
