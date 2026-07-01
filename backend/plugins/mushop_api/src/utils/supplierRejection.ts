import { IModels } from '~/connectionResolvers';
import { SUPPLIER_VERIFICATION_STATUS } from '~/constants';
import { MUSHOP_PRODUCT_STATUS } from '@/product/db/definitions/product';
import {
  removeProductFromPosclient,
  syncProductToPosclient,
} from '~/utils/syncProductToPosclient';

const isRejected = (status?: string) =>
  status === SUPPLIER_VERIFICATION_STATUS.UNVERIFIED;

// React to a supplier's verification status change by hiding/restoring its
// products. Rejecting (→ unverified) hides every product and untags them from
// the supplier's mushop POS; re-verifying restores the previously-hidden ones
// and re-pushes the approved ones back to POS. Products the supplier deleted
// themselves keep their `deleted` state throughout.
export const applySupplierRejectionChange = async ({
  models,
  subdomain,
  posToken,
  prevStatus,
  nextStatus,
}: {
  models: IModels;
  subdomain: string;
  posToken?: string;
  prevStatus?: string;
  nextStatus?: string;
}): Promise<void> => {
  const wasRejected = isRejected(prevStatus);
  const nowRejected = isRejected(nextStatus);

  if (wasRejected === nowRejected) return;

  if (nowRejected) {
    const hidden = await models.Product.hideBySubdomain(subdomain);

    await Promise.all(
      hidden.map((p) =>
        removeProductFromPosclient({ subdomain, posToken, productId: p._id }),
      ),
    );

    return;
  }

  const restored = await models.Product.unhideBySubdomain(subdomain);

  await Promise.all(
    restored
      .filter((p) => p.status === MUSHOP_PRODUCT_STATUS.APPROVED)
      .map((p) =>
        syncProductToPosclient({
          subdomain,
          posToken,
          product: p,
          action: 'update',
        }),
      ),
  );
};
