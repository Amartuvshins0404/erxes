import { IContext } from '~/connectionResolvers';
import { sendSupplierMessage } from '~/utils/sendSupplierMessage';
import { applySupplierRejectionChange } from '~/utils/supplierRejection';

export const supplierMutations = {
  mushopUpdateSupplierVerificationStatus: async (
    _root: undefined,
    {
      _id,
      verificationStatus,
      note,
    }: { _id: string; verificationStatus: string; note?: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopUpdateSupplierVerificationStatus');

    const existing = await models.Supplier.getSupplier(_id);

    try {
      await sendSupplierMessage({
        subdomain: existing.subdomain,
        action: 'supplier',
        payload: {
          entityId: existing.entityId,
          data: { verificationStatus, note },
        },
        timeout: 5000,
      });
    } catch (error) {
      throw new Error(`Failed to send supplier status: ${error.message}`);
    }

    const updated = await models.Supplier.updateVerificationStatus(
      _id,
      verificationStatus,
      note,
    );

    await applySupplierRejectionChange({
      models,
      subdomain: existing.subdomain,
      posToken: updated?.mushopPosToken,
      prevStatus: existing.verificationStatus,
      nextStatus: verificationStatus,
    });

    return updated;
  },

  mushopUpdateSupplierTier: async (
    _root: undefined,
    { _id, tierLevel }: { _id: string; tierLevel: number },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopUpdateSupplierTier');
    return models.Supplier.updateTierLevel(_id, tierLevel);
  },


  mushopUpdateSupplierMushopPos: async (
    _root: undefined,
    { _id, mushopPosToken }: { _id: string; mushopPosToken: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopUpdateSupplierMushopPos');

    return models.Supplier.findOneAndUpdate(
      { _id },
      { $set: { mushopPosToken } },
      { new: true },
    );
  },
};
