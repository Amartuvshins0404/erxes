import { IContext } from '~/connectionResolvers';
import { ITrDetail } from '~/modules/accounting/@types/transaction';

export default {
  __resolveReference({ _id }, { models }: IContext) {
    return models.Transactions.findOne({ 'details._id': _id });
  },

  async account(trDetail: ITrDetail, _, { models }: IContext) {
    return await models.Accounts.findOne({ _id: trDetail.accountId }).lean();
  },

  async placeEntity(trDetail: ITrDetail) {
    if (!trDetail.placeEntityId) {
      return;
    }

    return {
      __typename: 'StructureEntity',
      _id: trDetail.placeEntityId,
    };
  },

  async responsibleEntity(trDetail: ITrDetail) {
    if (!trDetail.responsibleEntityId) {
      return;
    }

    return {
      __typename: 'StructureEntity',
      _id: trDetail.responsibleEntityId,
    };
  },

  async product(trDetail: ITrDetail) {
    if (!trDetail.productId) {
      return;
    }

    return {
      __typename: 'Product',
      _id: trDetail.productId,
    };
  },
};
