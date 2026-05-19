import { IContext } from '~/connectionResolvers';
import { syncCollectiveProducts } from '@/collective/utils/syncCollectiveProducts';
import { provisionCollectivePos } from '@/collective/utils/provisionCollectivePos';
import { purgeCollectiveSupplier } from '@/collective/utils/purgeCollectiveSupplier';
import { Resolver } from 'erxes-api-shared/core-types';
import { COLLECTIVE_STATUS } from '~/modules/collective/@types/collective';

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
    const pos = await provisionCollectivePos({ targetSubdomain });

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
          await purgeCollectiveSupplier({
            supplierSubdomain: supplier.subdomain,
            supplierPosToken: supplier.posToken,
            supplierId: supplier._id,
            targetSubdomain: collective.targetSubdomain,
            targetPosToken: collective.targetPosToken,
            collectiveId: collective._id,
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
    { _id }: { _id: string },
    { models }: IContext,
  ) => {
    const collective = await models.Collective.getCollective(_id);

    try {
      syncCollectiveProducts({ models, collectiveId: collective._id });
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

collectiveMutations.mushopCreateCollective.wrapperConfig = {
  skipPermission: true,
};

collectiveMutations.mushopUpdateCollectiveSuppliers.wrapperConfig = {
  skipPermission: true,
};

collectiveMutations.mushopResyncCollective.wrapperConfig = {
  skipPermission: true,
};
