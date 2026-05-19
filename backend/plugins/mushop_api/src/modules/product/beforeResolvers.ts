import { BeforeResolverParams } from 'erxes-api-shared/utils';
import { generateModels } from '~/connectionResolvers';

const resolvers = {
  posclient: ['cpPoscProducts'],
};

export const beforeResolverHandlers = async (
  subdomain: string,
  params: BeforeResolverParams,
) => {
  const { resolver, args, headers } = params;

  if (!resolvers.posclient.includes(resolver)) {
    return args;
  }

  console.log('resolver', resolver);

  const supplierId = headers?.['erxes-supplier-id'];

  console.log('supplierId', supplierId);

  if (!supplierId) {
    return args;
  }

  const models = await generateModels(subdomain);

  const supplier = await models.Supplier.getSupplier(supplierId);

  if (!supplier?.subdomain) {
    return args;
  }

  const products = await models.MushopProduct.find({
    subdomain: supplier.subdomain,
  })
    .distinct('_id')
    .lean();

  const productIds = new Array(...new Set(products.map((p) => p.toString())));

  return { ...args, ids: productIds.length ? productIds : [] };
};

export default {
  resolvers,
  handler: beforeResolverHandlers,
};
