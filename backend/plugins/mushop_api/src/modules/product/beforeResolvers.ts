import {
  BeforeResolverParams,
  BeforeResolverResult,
  BeforeResolversConfig,
} from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';
import { getSupplierId } from '~/utils/getSupplierId';

export const productBeforeResolvers: BeforeResolversConfig = {
  resolvers: { posclient: ['cpPoscProducts'] },
  handler: async (
    subdomain: string,
    params: BeforeResolverParams,
  ): Promise<BeforeResolverResult> => {
    const { resolver, args = {}, headers } = params;

    if (resolver !== 'cpPoscProducts') {
      return args;
    }

    const supplierId = getSupplierId(headers);

    if (!supplierId) {
      return args;
    }

    const models = await generateModels(subdomain);

    const supplier = await models.Supplier.getSupplier(supplierId);

    if (!supplier?.subdomain) {
      return args;
    }

    const products = await models.Product.find({
      subdomain: supplier.subdomain,
    })
      .distinct('_id')
      .lean();

    const productIds = Array.from(new Set(products.map((p) => p.toString())));

    if (!productIds.length) {
      return { ...args, ids: [''] };
    }

    return { ...args, ids: productIds };
  },
};
