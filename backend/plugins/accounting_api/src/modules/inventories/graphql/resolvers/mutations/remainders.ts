import { IContext } from '~/connectionResolvers';
import { updateLiveRemainders } from './utils';

interface IUpdateRemaindersParams {
  placeEntityId?: string;
  productCategoryId?: string;
  productIds?: string[];
}

const remainderMutations = {
  reCalcRemainders: async (
    _root: any,
    params: IUpdateRemaindersParams,
    { subdomain, models }: IContext,
  ) => {
    const { placeEntityId, productCategoryId, productIds } = params;
    if (!placeEntityId && !productCategoryId && !productIds?.length) {
      throw new Error('Please set at least one filter.');
    }

    await updateLiveRemainders({
      subdomain,
      models,
      placeEntityId: placeEntityId || '_',
      productCategoryId,
      productIds,
    });

    return 'success';
  },
};

export default remainderMutations;
