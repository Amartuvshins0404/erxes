import { IContext } from '~/connectionResolvers';
import { ICollectivePackageDocument } from '@/collective-package/@types/collectivePackage';

export const MushopCollectivePackage = {
  collective: async (
    { collectiveId }: ICollectivePackageDocument,
    _args: unknown,
    { models }: IContext,
  ) => {
    if (!collectiveId) return null;
    return models.Collective.findOne({ _id: collectiveId }).lean();
  },

  products: async (
    { productIds = [] }: ICollectivePackageDocument,
    _args: unknown,
    { models }: IContext,
  ) => {
    if (!productIds.length) return [];
    return models.MushopProduct.find({ entityId: { $in: productIds } }).lean();
  },

  componentsTotal: async (
    { productIds = [] }: ICollectivePackageDocument,
    _args: unknown,
    { models }: IContext,
  ) => {
    if (!productIds.length) return 0;

    const products = await models.MushopProduct.find({
      entityId: { $in: productIds },
    })
      .select({ unitPrice: 1 })
      .lean();

    return products.reduce(
      (sum, p: any) => sum + (Number(p.unitPrice) || 0),
      0,
    );
  },
};
