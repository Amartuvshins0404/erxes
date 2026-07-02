import { Schema } from 'mongoose';
import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { IMushopProductSpecificationDocument } from '@/product-specification/@types/productSpecification';

export const mushopProductSpecificationSchema =
  new Schema<IMushopProductSpecificationDocument>(
    {
      _id: mongooseStringRandomId,
      productId: { type: String, unique: true, sparse: true, index: true },
      code: { type: String, index: true },
      moq: { type: Number },
      cnyCost: { type: Number },
      profitPercent: { type: Number },
      prepaymentPercent: { type: Number },
    },
    {
      timestamps: true,
    },
  );
