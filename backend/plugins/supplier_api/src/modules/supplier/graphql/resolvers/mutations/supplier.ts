import { IContext } from '~/connectionResolvers';
import { ISupplier } from '@/supplier/@types/supplier';
import { sendMessage } from '~/modules/admin/utils';

export const supplierMutations = {
  supplierUpdateProfile: async (
    _root: undefined,
    { input }: { input: ISupplier },
    { models, user, subdomain }: IContext,
  ) => {
    const supplier = await models.Supplier.updateSupplier(user._id, input);

    if (supplier) {
      await sendMessage({
        subdomain,
        path: 'updateSupplier',
        payload: {
          entityId: supplier._id,
          data: { input, userId: user._id },
        },
      });
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
