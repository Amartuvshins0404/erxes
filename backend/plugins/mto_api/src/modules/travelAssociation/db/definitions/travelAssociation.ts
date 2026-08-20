import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

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

export const travelAssociationSchema = new Schema(
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
    logo: { type: String, label: 'Logo URL' },
    cover: { type: String, label: 'Cover URL' },
    foundDate: {
      type: Date,
      required: true,
      label: 'Found date',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);
