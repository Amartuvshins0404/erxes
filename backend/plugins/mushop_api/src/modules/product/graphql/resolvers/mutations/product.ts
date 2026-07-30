import { IContext } from '~/connectionResolvers';
import { MUSHOP_PRODUCT_STATUS } from '@/product/db/definitions/product';
import {
  removeProductFromPosclient,
  syncProductToPosclient,
} from '~/utils/syncProductToPosclient';

const getSupplierMushopPosToken = async (
  models: IContext['models'],
  subdomain: string,
): Promise<string | undefined> => {
  const supplier = await models.Supplier.findOne({ subdomain }).lean();

  return supplier?.mushopPosToken;
};

export const productMutations = {
  mushopAssignProductCategory: async (
    _root: undefined,
    { _id, categoryId }: { _id: string; categoryId?: string },
    { models, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopAssignProductCategory');
    const product = await models.Product.assignCategory(
      _id,
      categoryId || null,
    );

    if (product?.status === 'approved') {
      const posToken = await getSupplierMushopPosToken(
        models,
        product.subdomain,
      );

      if (categoryId) {
        await syncProductToPosclient({
          subdomain,
          posToken,
          product,
        });
      } else {
        await removeProductFromPosclient({
          subdomain,
          posToken,
          productId: _id,
        });
      }
    }

    return product;
  },

  mushopBulkUpdateProductStatus: async (
    _root: undefined,
    { ids, status }: { ids: string[]; status: string },
    { models, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopBulkUpdateProductStatus');
    if (!MUSHOP_PRODUCT_STATUS.ALL.includes(status)) {
      throw new Error('Invalid product status');
    }

    try {
      if (status === 'approved') {
        const products = await models.Product.find({
          _id: { $in: ids },
          categoryId: { $exists: true, $ne: null },
        }).lean();

        await Promise.all(
          products.map(async (p) => {
            const posToken = await getSupplierMushopPosToken(
              models,
              p.subdomain,
            );

            return syncProductToPosclient({
              subdomain,
              posToken,
              product: p,
            });
          }),
        );
      }

      if (status === MUSHOP_PRODUCT_STATUS.REJECTED) {
        const products = await models.Product.find({
          _id: { $in: ids },
        }).lean();

        await Promise.all(
          products.map(async (p) => {
            const posToken = await getSupplierMushopPosToken(
              models,
              p.subdomain,
            );

            return removeProductFromPosclient({
              subdomain,
              posToken,
              productId: p._id,
            });
          }),
        );
      }

      await models.Product.updateMany(
        { _id: { $in: ids } },
        { $set: { status } },
      );

      return true;
    } catch (error) {
      throw new Error(
        `Failed to sync products to POS client: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  },

  mushopRemoveProduct: async (
    _root: undefined,
    { _id }: { _id: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopRemoveProduct');
    await models.Product.removeProduct(_id);
    return { success: true };
  },

  mushopBulkRemoveProducts: async (
    _root: undefined,
    { ids }: { ids: string[] },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopBulkRemoveProducts');
    await models.Product.deleteMany({ _id: { $in: ids } });
    return { success: true, count: ids.length };
  },

  mushopUpdateProductStatus: async (
    _root: undefined,
    { _id, status, note }: { _id: string; status: string; note?: string },
    { models, subdomain, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopUpdateProductStatus');
    if (!MUSHOP_PRODUCT_STATUS.ALL.includes(status)) {
      throw new Error('Invalid product status');
    }

    const existing = await models.Product.getProduct(_id);

    const updated = await models.Product.updateStatus(_id, status, note);

    if (status === 'approved' && existing.categoryId) {
      const posToken = await getSupplierMushopPosToken(
        models,
        existing.subdomain,
      );
      await syncProductToPosclient({
        subdomain,
        posToken,
        product: updated ?? existing,
        action: 'create',
      });
    }

    if (status === MUSHOP_PRODUCT_STATUS.REJECTED) {
      const posToken = await getSupplierMushopPosToken(
        models,
        existing.subdomain,
      );
      await removeProductFromPosclient({
        subdomain,
        posToken,
        productId: _id,
      });
    }

    return updated;
  },

  mushopSyncProductsToPosclient: async (
    _root: undefined,
    { supplierId, status }: { supplierId?: string; status?: string },
    { models, subdomain }: IContext,
  ) => {
    if (status && !MUSHOP_PRODUCT_STATUS.ALL.includes(status)) {
      throw new Error('Invalid product status');
    }

    if (status && status !== MUSHOP_PRODUCT_STATUS.APPROVED) {
      throw new Error('Only approved products can be synced to POS client');
    }

    const filter: Record<string, any> = {
      status: MUSHOP_PRODUCT_STATUS.APPROVED,
      categoryId: { $exists: true, $ne: null },
    };

    if (supplierId) {
      const supplier = await models.Supplier.getSupplier(supplierId);
      filter.subdomain = supplier.subdomain;
    }

    const products = await models.Product.find(filter).lean();

    const posTokenCache = new Map<string, string | undefined>();
    const getPosToken = async (sub: string) => {
      if (!posTokenCache.has(sub)) {
        posTokenCache.set(sub, await getSupplierMushopPosToken(models, sub));
      }
      return posTokenCache.get(sub);
    };

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    await Promise.all(
      products.map(async (product) => {
        const posToken = await getPosToken(product.subdomain);

        if (!posToken) {
          skipped++;
          return;
        }

        try {
          await syncProductToPosclient({
            subdomain,
            posToken,
            product,
            action: 'create',
          });
          synced++;
        } catch (e) {
          failed++;
          console.error('mushopSyncProductsToPosclient error:', e);
        }
      }),
    );

    return { total: products.length, synced, skipped, failed };
  },
};
