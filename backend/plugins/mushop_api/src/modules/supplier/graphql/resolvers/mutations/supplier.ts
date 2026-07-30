import { IContext } from '~/connectionResolvers';
import { sendSupplierMessage } from '~/utils/sendSupplierMessage';
import { fetchSupplierPosProducts } from '~/utils/fetchSupplierPosProducts';

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

    return models.Supplier.updateVerificationStatus(
      _id,
      verificationStatus,
      note,
    );
  },

  mushopUpdateSupplierTier: async (
    _root: undefined,
    { _id, tierLevel }: { _id: string; tierLevel: number },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopUpdateSupplierTier');
    return models.Supplier.updateTierLevel(_id, tierLevel);
  },

  mushopUpdateSupplierPos: async (
    _root: undefined,
    { _id, posToken }: { _id: string; posToken: string },
    { models, checkPermission }: IContext,
  ) => {
    await checkPermission('mushopUpdateSupplierPos');
    const supplier = await models.Supplier.getSupplier(_id);

    const updated = await models.Supplier.findOneAndUpdate(
      { _id },
      { $set: { posToken } },
      { new: true },
    );

    const products = await fetchSupplierPosProducts({
      subdomain: supplier.subdomain,
      posToken,
    });

    await Promise.all(
      products.map((p) =>
        models.Product.syncProduct(supplier.subdomain, p._id, {
          name: p.name,
          shortName: p.shortName,
          code: p.code,
          type: p.type,
          description: p.description,
          barcodes: p.barcodes,
          barcodeDescription: p.barcodeDescription,
          unitPrice: p.unitPrice,
          initialCategory: p.category,
          tagIds: p.tagIds,
          attachment: p.attachment,
          attachmentMore: p.attachmentMore,
          uom: p.uom,
          subUoms: p.subUoms,
          currency: p.currency,
          pdfAttachment: p.pdfAttachment,
        }),
      ),
    );

    return updated;
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
