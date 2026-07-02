import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';
import { EventStatus } from '@/event/@types/event';

const multilingualStringSchema = new Schema(
  {
    en: { type: String, required: true },
    mn: { type: String, required: true },
  },
  { _id: false },
);

const multilingualStringOptionalSchema = new Schema(
  {
    en: { type: String },
    mn: { type: String },
  },
  { _id: false },
);

export const eventSchema = new Schema(
  {
    _id: mongooseStringRandomId,
    createdAt: { type: Date, label: 'Created at', index: true },
    modifiedAt: { type: Date, label: 'Modified at' },

    title: {
      type: multilingualStringSchema,
      required: true,
      label: 'Title',
    },
    description: {
      type: multilingualStringOptionalSchema,
      label: 'Description',
    },
    image: { type: String, label: 'Image URL' },
    startDate: { type: Date, required: true, label: 'Start date', index: true },
    endDate: { type: Date, required: true, label: 'End date' },
    location: { type: String, label: 'Location' },
    categoryIds: {
      type: [String],
      default: [],
      label: 'Category IDs',
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.DRAFT,
      label: 'Status',
    },
    isActive: { type: Boolean, default: true, label: 'Is Active' },
  },
  {
    timestamps: true,
  },
);

eventSchema.index({ status: 1, isActive: 1 });
eventSchema.index({ categoryIds: 1 });
