import { IContext } from '~/connectionResolvers';
import { ISupplier } from '@/supplier/@types/supplier';
import { requestMessage, sendMessage } from '~/modules/admin/utils';
import { enqueuePosBackfill } from '~/workers/backfill';

export const supplierMutations = {
  supplierUpdateProfile: async (
    _root: undefined,
    { input }: { input: ISupplier },
    { models, user, subdomain }: IContext,
  ) => {
    const before = await models.Supplier.findOne().lean();
    const previousPosToken = before?.posToken;

    const supplier = await models.Supplier.updateSupplier(user._id, input);

    if (supplier?.posToken && supplier.posToken !== previousPosToken) {
      enqueuePosBackfill(subdomain, supplier.posToken).catch((e) =>
        console.error('Failed to enqueue POS backfill:', e),
      );
    }

    if (supplier) {
      const payload = {
        entityId: supplier._id,
        data: { input, userId: user._id },
      };

      try {
        const res = await requestMessage<{ code?: string }>({
          subdomain,
          path: 'updateSupplier',
          payload,
          platform: 'mushop',
        });

        if (res?.code && !supplier.code) {
          const withCode = await models.Supplier.findOneAndUpdate(
            { _id: supplier._id },
            { $set: { code: res.code } },
            { new: true },
          );
          if (withCode) return withCode;
        }
      } catch (e) {
        console.error('Failed to sync supplier code from mushop:', e);
      }

      await sendMessage({ subdomain, path: 'updateSupplier', payload });
    }

    return supplier;
  },

  supplierUpdateVerificationStatus: async (
    _root: undefined,
    { _id, status }: { _id: string; status: string },
    { models, user, subdomain }: IContext,
  ) => {
    if (!user) throw new Error('Login required');
    const supplier = await models.Supplier.updateVerificationStatus(
      _id,
      status,
    );
    if (supplier) {
      await sendMessage({
        subdomain,
        path: 'updateSupplier',
        payload: {
          entityId: supplier._id,
          data: { input: { verificationStatus: status } },
        },
      });
    }
    return supplier;
  },

  supplierUpdateTierLevel: async (
    _root: undefined,
    { _id, tierLevel }: { _id: string; tierLevel: number },
    { models, user, subdomain }: IContext,
  ) => {
    if (!user) throw new Error('Login required');
    const supplier = await models.Supplier.updateTierLevel(_id, tierLevel);
    if (supplier) {
      await sendMessage({
        subdomain,
        path: 'updateSupplier',
        payload: {
          entityId: supplier._id,
          data: { input: { tierLevel } },
        },
      });
    }
    return supplier;
  },
};
