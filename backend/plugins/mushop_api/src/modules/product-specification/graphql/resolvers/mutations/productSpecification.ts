import { IContext } from '~/connectionResolvers';
import { IMushopProductSpecification } from '@/product-specification/@types/productSpecification';

type SpecInput = Omit<IMushopProductSpecification, 'productId' | 'code'>;

export const productSpecificationMutations = {
  mushopProductSpecificationSave: async (
    _root: undefined,
    {
      productId,
      code,
      input,
    }: { productId?: string; code?: string; input: SpecInput },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopProductSpecificationSave');

    if (productId) {
      return models.ProductSpecification.saveByProductId(productId, code, input);
    }

    if (code) {
      return models.ProductSpecification.saveByCode(code, input);
    }

    throw new Error('Either productId or code is required');
  },
};
