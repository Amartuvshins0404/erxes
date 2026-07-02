import { IContext } from '~/connectionResolvers';

export const productSpecificationQueries = {
  mushopProductSpecification: async (
    _root: undefined,
    { productId, code }: { productId: string; code?: string },
    { models }: IContext,
  ) => {
    return models.ProductSpecification.resolve(productId, code);
  },
};
