import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { mushopProductSpecificationSchema } from '@/product-specification/db/definitions/productSpecification';
import {
  IMushopProductSpecification,
  IMushopProductSpecificationDocument,
} from '@/product-specification/@types/productSpecification';

type SpecValues = Omit<IMushopProductSpecification, 'productId' | 'code'>;

export interface IMushopProductSpecificationModel extends Model<IMushopProductSpecificationDocument> {
  resolve(
    productId: string,
    code?: string,
  ): Promise<IMushopProductSpecificationDocument | null>;
  saveByProductId(
    productId: string,
    code: string | undefined,
    doc: SpecValues,
  ): Promise<IMushopProductSpecificationDocument>;
  saveByCode(
    code: string,
    doc: SpecValues,
  ): Promise<IMushopProductSpecificationDocument>;
  linkByCode(
    code: string,
    productId: string,
  ): Promise<IMushopProductSpecificationDocument | null>;
}

export const loadMushopProductSpecificationClass = (models: IModels) => {
  class MushopProductSpecification {
    public static async resolve(productId: string, code?: string) {
      const byId = await models.ProductSpecification.findOne({ productId }).lean();

      if (byId || !code) {
        return byId;
      }

      return models.ProductSpecification.linkByCode(code, productId);
    }

    public static async saveByProductId(
      productId: string,
      code: string | undefined,
      doc: SpecValues,
    ) {
      return models.ProductSpecification.findOneAndUpdate(
        { productId },
        { $set: { ...doc, ...(code ? { code } : {}) }, $setOnInsert: { productId } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async saveByCode(code: string, doc: SpecValues) {
      return models.ProductSpecification.findOneAndUpdate(
        { code, productId: { $exists: false } },
        { $set: { ...doc, code } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async linkByCode(code: string, productId: string) {
      return models.ProductSpecification.findOneAndUpdate(
        { code, productId: { $exists: false } },
        { $set: { productId } },
        { new: true },
      ).lean();
    }
  }

  mushopProductSpecificationSchema.loadClass(MushopProductSpecification);

  return mushopProductSpecificationSchema;
};
