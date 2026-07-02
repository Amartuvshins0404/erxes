import { IContext } from '~/connectionResolvers';
import { syncCollectiveProducts } from '@/collective/utils/syncCollectiveProducts';
import { sendSupplierMessage } from '~/utils/sendSupplierMessage';
import { Resolver } from 'erxes-api-shared/core-types';
import { COLLECTIVE_STATUS } from '~/modules/collective/@types/collective';
import { registerCollectivePartners } from '@/collective/utils/registerCollectivePartners';

export const collectiveMutations: Record<string, Resolver> = {
  mushopCreateCollective: async (
    _root: undefined,
    {
      targetSubdomain,
      supplierIds,
    }: {
      targetSubdomain: string;
      supplierIds: string[];
    },
    { models }: IContext,
  ) => {
    const suppliers = await models.Supplier.find({ _id: { $in: supplierIds }}).lean();

    if (suppliers.length !== supplierIds.length) {
      throw new Error('One or more suppliers not found');
    }

    const subdomains = new Set<string>();

    for (const supplier of suppliers) {
      if (supplier.subdomain) {
        subdomains.add(supplier.subdomain);
      }
    }

    if (!subdomains.size) {
      throw new Error('Selected suppliers have no subdomains to register');
    }

    await registerCollectivePartners({
      subdomain: targetSubdomain,
      subdomains: Array.from(subdomains),
    });

    const pos = await sendSupplierMessage<{ _id: string; token: string }>({
      subdomain: targetSubdomain,
      action: 'create-pos',
      timeout: 60000,
    });

    if (!pos?.token) {
      throw new Error('POS provisioning response missing token');
    }

    const collective = await models.Collective.createCollective({
      targetSubdomain,
      targetPosToken: pos.token,
      supplierIds,
    });

    try {
      syncCollectiveProducts({
        models,
        collectiveId: collective._id,
      });
    } catch (error) {
      models.Collective.updateSyncProgress(collective._id, {
        status: COLLECTIVE_STATUS.FAILED,
      });

      throw new Error(
        `Failed to sync collective products: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return collective;
  },

  mushopUpdateCollectiveSuppliers: async (
    _root: undefined,
    { _id, supplierIds }: { _id: string; supplierIds: string[] },
    { models }: IContext,
  ) => {
    const { collective, added, removed } =
      await models.Collective.updateSuppliers(_id, supplierIds);

    if (removed.length && collective.targetPosToken) {
      const removedSuppliers = await models.Supplier.find({
        _id: { $in: removed },
      }).lean();

      for (const supplier of removedSuppliers) {
        if (!supplier.posToken) continue;

        try {
          await sendSupplierMessage({
            subdomain: supplier.subdomain,
            action: 'collective-purge-push',
            payload: {
              collectiveId: collective._id,
              targetSubdomain: collective.targetSubdomain,
              targetPosToken: collective.targetPosToken,
              posToken: supplier.posToken,
              supplierId: supplier._id,
            },
            timeout: 120000,
          });
        } catch (e) {
          console.error(
            `Failed to purge supplier ${supplier._id} from collective ${collective._id}:`,
            e,
          );
        }
      }
    }

    if (added.length) {
      try {
        syncCollectiveProducts({
          models,
          collectiveId: collective._id,
          supplierIds: added,
        });
      } catch (error) {
        models.Collective.updateSyncProgress(collective._id, {
          status: COLLECTIVE_STATUS.FAILED,
        });

        throw new Error(
          `Failed to sync collective products: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return collective;
  },

  mushopResyncCollective: async (
    _root: undefined,
    { _id, supplierIds }: { _id: string; supplierIds?: string[] },
    { models }: IContext,
  ) => {
    const collective = await models.Collective.getCollective(_id);

    try {
      syncCollectiveProducts({
        models,
        collectiveId: collective._id,
        supplierIds: supplierIds?.length ? supplierIds : undefined,
      });
    } catch (error) {
      models.Collective.updateSyncProgress(collective._id, {
        status: COLLECTIVE_STATUS.FAILED,
      });

      throw new Error(
        `Failed to sync collective products: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return collective;
  },

  mushopRemoveCollective: async (
    _root: undefined,
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    return models.Collective.removeCollective(_id);
  },
};


collectiveMutations.mushopUpdateCollectiveSuppliers.wrapperConfig = {
  skipPermission: true,
};

collectiveMutations.mushopResyncCollective.wrapperConfig = {
  skipPermission: true,
};
