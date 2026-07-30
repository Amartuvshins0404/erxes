import { IContext } from '~/connectionResolvers';
import { BA_PRODUCT_STATUS } from '@/supplier/product/db/definitions/product';

export const productMutations = {
  baUpdateProductStatus: async (
    _root: undefined,
    { _id, status, note }: { _id: string; status: string; note?: string },
    { models }: IContext,
  ) => {
    if (!BA_PRODUCT_STATUS.ALL.includes(status)) {
      throw new Error(`Invalid product status: ${status}`);
    }
    return models.SupplierProduct.updateStatus(_id, status, note);
  },

  baAssignProductCategory: async (
    _root: undefined,
    { _id, categoryId }: { _id: string; categoryId?: string },
    { models }: IContext,
  ) => {
    return models.SupplierProduct.assignCategory(_id, categoryId ?? null);
  },

  baRemoveProduct: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    await models.SupplierProduct.removeProduct(_id);
    return { ok: 1 };
  },
};
