import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import {
  baProductSchema,
  BA_PRODUCT_STATE,
} from '@/supplier/product/db/definitions/product';
import {
  IBaProduct,
  IBaProductBlockDocument,
} from '@/supplier/product/@types/product';

export interface IBaProductModel extends Model<IBaProductBlockDocument> {
  getProduct(_id: string): Promise<IBaProductBlockDocument>;
  syncProduct(
    subdomain: string,
    entityId: string,
    doc: IBaProduct,
    action?: 'create' | 'update',
  ): Promise<IBaProductBlockDocument | null>;
  softDeleteByEntityIds(
    subdomain: string,
    entityIds: string[],
  ): Promise<IBaProductBlockDocument[]>;
  assignCategory(
    _id: string,
    categoryId: string | null,
  ): Promise<IBaProductBlockDocument>;
  removeProduct(_id: string): Promise<IBaProductBlockDocument | null>;
  updateStatus(
    _id: string,
    status: string,
    note?: string,
  ): Promise<IBaProductBlockDocument | null>;
}

export const loadBaProductClass = (models: IModels) => {
  class BaProduct {
    public static async getProduct(_id: string) {
      const product = await models.SupplierProduct.findOne({
        _id,
        state: BA_PRODUCT_STATE.ACTIVE,
      }).lean();
      if (!product) throw new Error('Product not found');
      return product;
    }

    public static async syncProduct(
      subdomain: string,
      entityId: string,
      doc: IBaProduct,
      _action?: 'create' | 'update',
    ) {
      const { initialCategory, ...rest } = doc || {};

      return models.SupplierProduct.findOneAndUpdate(
        { subdomain, entityId },
        {
          $set: {
            ...rest,
            ...(initialCategory ? { initialCategory } : {}),
            state: BA_PRODUCT_STATE.ACTIVE,
          },
          $setOnInsert: { subdomain, entityId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async softDeleteByEntityIds(
      subdomain: string,
      entityIds: string[],
    ) {
      if (!entityIds.length) return [];

      const affected = await models.SupplierProduct.find({
        subdomain,
        entityId: { $in: entityIds },
        state: { $ne: BA_PRODUCT_STATE.DELETED },
      }).lean();

      if (!affected.length) return [];

      await models.SupplierProduct.updateMany(
        {
          subdomain,
          entityId: { $in: entityIds },
          state: { $ne: BA_PRODUCT_STATE.DELETED },
        },
        { $set: { state: BA_PRODUCT_STATE.DELETED } },
      );

      return affected;
    }

    public static async removeProduct(_id: string) {
      const product = await models.SupplierProduct.findOne({ _id }).lean();
      if (!product) throw new Error('Product not found');
      await models.SupplierProduct.deleteOne({ _id });
      return product;
    }

    public static async assignCategory(_id: string, categoryId: string | null) {
      const product = await models.SupplierProduct.findOneAndUpdate(
        { _id },
        { $set: { categoryId: categoryId || null } },
        { new: true },
      );
      if (!product) throw new Error('Product not found');
      return product;
    }

    public static async updateStatus(
      _id: string,
      status: string,
      note?: string,
    ) {
      return models.SupplierProduct.findOneAndUpdate(
        { _id },
        { $set: { status, note: status === 'rejected' ? note ?? null : null } },
        { new: true },
      );
    }
  }

  baProductSchema.loadClass(BaProduct);

  return baProductSchema;
};
