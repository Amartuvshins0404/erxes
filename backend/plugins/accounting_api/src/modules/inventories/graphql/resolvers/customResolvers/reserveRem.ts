import { IContext } from '~/connectionResolvers';
import { IReserveRemDocument } from '~/modules/inventories/@types/reserveRems';

export default {
  async __resolveReference({ _id }, { models }: IContext) {
    return models.ReserveRems.findOne({ _id });
  },

  async placeEntity(reserveRem: IReserveRemDocument) {
    if (!reserveRem.placeEntityId) {
      return;
    }

    return {
      __typename: 'StructureEntity',
      _id: reserveRem.placeEntityId,
    };
  },

  async product(reserveRem: IReserveRemDocument) {
    if (!reserveRem.productId) {
      return;
    }

    return {
      __typename: 'Product',
      _id: reserveRem.productId,
    };
  },
};
