import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import {
  COLLECTIVE_PACKAGE_STATUS,
  ICollectivePackageDocument,
} from '@/collective-package/@types/collectivePackage';

export const collectivePackageSchema = new Schema<ICollectivePackageDocument>(
  {
    _id: mongooseStringRandomId,
    name: { type: String, label: 'Name' },
    description: { type: String, label: 'Description' },
    coverImage: { type: String, label: 'Cover image' },

    collectiveId: { type: String, required: true, index: true },
    posToken: { type: String, required: true, index: true },
    productIds: { type: [String], default: [], index: true },

    price: { type: Number, label: 'Bundle price' },

    status: {
      type: String,
      enum: COLLECTIVE_PACKAGE_STATUS.ALL,
      default: COLLECTIVE_PACKAGE_STATUS.DRAFT,
      index: true,
    },
  },
  { timestamps: true },
);
