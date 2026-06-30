import { Model } from 'mongoose';
import { EventDispatcherReturn } from 'erxes-api-shared/core-modules';
import { IModels } from '~/connectionResolvers';
import {
  mushopProductSchema,
  MUSHOP_PRODUCT_STATE,
} from '@/product/db/definitions/product';
import {
  IMushopProduct,
  IMushopProductMushopDocument,
} from '@/product/@types/product';
import {
  buildProductSubmittedLog,
  buildProductResubmittedLog,
  buildProductStatusChangedLog,
} from '~/meta/activity-log/product';
import { SUPPLIER_VERIFICATION_STATUS } from '~/constants';

export interface IMushopProductModel
  extends Model<IMushopProductMushopDocument> {
  syncProduct(
    subdomain: string,
    entityId: string,
    doc: IMushopProduct,
    action?: 'create' | 'update',
  ): Promise<IMushopProductMushopDocument>;
  getProduct(_id: string): Promise<IMushopProductMushopDocument>;
  softDeleteByEntityIds(
    subdomain: string,
    entityIds: string[],
  ): Promise<IMushopProductMushopDocument[]>;
  hideBySubdomain(subdomain: string): Promise<IMushopProductMushopDocument[]>;
  unhideBySubdomain(subdomain: string): Promise<IMushopProductMushopDocument[]>;
  assignCategory(
    _id: string,
    categoryId: string | null,
  ): Promise<IMushopProductMushopDocument>;
  removeProduct(_id: string): Promise<IMushopProductMushopDocument | null>;
  updateStatus(
    _id: string,
    status: string,
    note?: string,
  ): Promise<IMushopProductMushopDocument | null>;
}

export const loadMushopProductClass = (
  models: IModels,
  { createActivityLog }: EventDispatcherReturn,
) => {
  class MushopProduct {
    public static async syncProduct(
      subdomain: string,
      entityId: string,
      doc: IMushopProduct,
      action?: 'create' | 'update',
    ) {
      const { initialCategory, ...rest } = doc;

      const existing = await models.Product.findOne({
        subdomain,
        entityId,
      }).lean();

      const supplier = await models.Supplier.findOne({ subdomain })
        .select('verificationStatus')
        .lean();

      const state =
        supplier?.verificationStatus === SUPPLIER_VERIFICATION_STATUS.UNVERIFIED
          ? MUSHOP_PRODUCT_STATE.HIDDEN
          : MUSHOP_PRODUCT_STATE.ACTIVE;

      const synced = await models.Product.findOneAndUpdate(
        { subdomain, entityId },
        {
          $set: {
            ...rest,
            ...(initialCategory ? { initialCategory } : {}),
            state,
          },
          $setOnInsert: { subdomain, entityId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (synced) {
        if (!existing) {
          createActivityLog(buildProductSubmittedLog(synced));
        } else if (action === 'update') {
          createActivityLog(buildProductResubmittedLog(synced));
        }
      }

      return synced;
    }

    public static async getProduct(_id: string) {
      const product = await models.Product.findOne({
        _id,
        state: MUSHOP_PRODUCT_STATE.ACTIVE,
      }).lean();
      if (!product) throw new Error('Product not found');
      return product;
    }

    public static async softDeleteByEntityIds(
      subdomain: string,
      entityIds: string[],
    ) {
      if (!entityIds.length) return [];

      const affected = await models.Product.find({
        subdomain,
        entityId: { $in: entityIds },
        state: { $ne: MUSHOP_PRODUCT_STATE.DELETED },
      }).lean();

      if (!affected.length) return [];

      await models.Product.updateMany(
        {
          subdomain,
          entityId: { $in: entityIds },
          state: { $ne: MUSHOP_PRODUCT_STATE.DELETED },
        },
        { $set: { state: MUSHOP_PRODUCT_STATE.DELETED } },
      );

      return affected;
    }

    public static async hideBySubdomain(subdomain: string) {
      const affected = await models.Product.find({
        subdomain,
        state: MUSHOP_PRODUCT_STATE.ACTIVE,
      }).lean();

      if (!affected.length) return [];

      await models.Product.updateMany(
        { subdomain, state: MUSHOP_PRODUCT_STATE.ACTIVE },
        { $set: { state: MUSHOP_PRODUCT_STATE.HIDDEN } },
      );

      return affected;
    }

    public static async unhideBySubdomain(subdomain: string) {
      const affected = await models.Product.find({
        subdomain,
        state: MUSHOP_PRODUCT_STATE.HIDDEN,
      }).lean();

      if (!affected.length) return [];

      await models.Product.updateMany(
        { subdomain, state: MUSHOP_PRODUCT_STATE.HIDDEN },
        { $set: { state: MUSHOP_PRODUCT_STATE.ACTIVE } },
      );

      return affected;
    }

    public static async removeProduct(_id: string) {
      const product = await models.Product.findOne({ _id }).lean();
      if (!product) throw new Error('Product not found');
      await models.Product.deleteOne({ _id });
      return product;
    }

    public static async assignCategory(_id: string, categoryId: string | null) {
      const product = await models.Product.findOneAndUpdate(
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
      const product = await models.Product.findOneAndUpdate(
        { _id },
        { $set: { status, note: status === 'rejected' ? note ?? null : null } },
        { new: true },
      );

      if (product) {
        createActivityLog(buildProductStatusChangedLog(product, status, note));
      }

      return product;
    }
  }

  mushopProductSchema.loadClass(MushopProduct);

  return mushopProductSchema;
};
