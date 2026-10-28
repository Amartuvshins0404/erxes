import { ISafeRemainderDocument } from '~/modules/inventories/@types/safeRemainders';

export default {
  async modifiedUser(safeRemainder: ISafeRemainderDocument) {
    return {
      __typename: 'User',
      _id: safeRemainder.modifiedBy,
    };
  },

  async placeEntity(reserveRem: ISafeRemainderDocument) {
    if (!reserveRem.placeEntityId) {
      return;
    }

    return {
      __typename: 'StructureEntity',
      _id: reserveRem.placeEntityId,
    };
  },

  async productCategory(reserveRem: ISafeRemainderDocument) {
    if (!reserveRem.productCategoryId) {
      return;
    }
    return {
      __typename: 'ProductCategory',
      _id: reserveRem.productCategoryId,
    };
  },
};
