import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';
import { CategoryLevel } from '@/category/@types/category';

const multilingualStringSchema = new Schema(
  {
    en: { type: String, required: true },
    mn: { type: String, required: true },
  },
  { _id: false },
);

export const categorySchema = new Schema(
  {
    _id: mongooseStringRandomId,
    createdAt: { type: Date, label: 'Created at', index: true },
    modifiedAt: { type: Date, label: 'Modified at' },

    name: {
      type: multilingualStringSchema,
      required: true,
      label: 'Name',
    },
    logo: { type: String, label: 'Logo URL' },
    level: {
      type: String,
      enum: Object.values(CategoryLevel),
      default: CategoryLevel.MAIN,
      label: 'Level',
      index: true,
    },
    parentId: { type: String, label: 'Parent ID', index: true },
    isActive: { type: Boolean, default: true, label: 'Is Active' },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ parentId: 1 });
categorySchema.index({ isActive: 1 });
