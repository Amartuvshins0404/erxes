import { IContext } from '~/connectionResolvers';

export const supplierMutations = {
  baUpdateSupplierVerificationStatus: async (
    _root: undefined,
    {
      _id,
      verificationStatus,
      note,
    }: { _id: string; verificationStatus: string; note?: string },
    { models }: IContext,
  ) => {
    return models.Supplier.updateVerificationStatus(
      _id,
      verificationStatus,
      note,
    );
  },

  baUpdateSupplierTier: async (
    _root: undefined,
    { _id, tierLevel }: { _id: string; tierLevel: number },
    { models }: IContext,
  ) => {
    return models.Supplier.updateTierLevel(_id, tierLevel);
  },
};
