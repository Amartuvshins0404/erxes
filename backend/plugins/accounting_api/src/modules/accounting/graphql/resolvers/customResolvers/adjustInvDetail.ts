import { IContext } from '~/connectionResolvers';
import { IAdjustInvDetail } from '~/modules/accounting/@types/adjustInventory';

export default {
  __resolveReference({ _id }, { models }: IContext) {
    return models.AdjustInvDetails.findOne({ _id });
  },

  async account(detail: IAdjustInvDetail, _, { models }: IContext) {
    return await models.Accounts.getAccount({ _id: detail.accountId });
  },

  async product(detail: IAdjustInvDetail) {
    if (!detail.productId) {
      return;
    }

    return {
      __typename: 'Product',
      _id: detail.productId,
    };
  },

  async placeEntity(detail: IAdjustInvDetail) {
    if (!detail.placeEntityId) {
      return;
    }

    return {
      __typename: 'StructureEntity',
      _id: detail.placeEntityId,
    };
  },
};
