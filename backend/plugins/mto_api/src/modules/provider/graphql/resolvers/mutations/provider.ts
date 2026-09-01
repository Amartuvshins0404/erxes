import { IContext } from '~/connectionResolvers';
import { IProvider, ProviderStatus } from '@/provider/@types/provider';
import { validateProviderOwnershipByProvider } from '~/utils/ownershipValidator';

export const providerMutations = {
  async mtoProfileCreate(_root: undefined, doc: IProvider, context: IContext) {
    const { models } = context;

    const instanceId = context.instanceId;

    return await models.Provider.createProvider({
      ...doc,
      categoryIds: doc.categoryIds ?? [],
      facilities: doc.facilities ?? [],
      status: ProviderStatus.PENDING,
      isActive: doc.isActive ?? true,
      instanceId,
    });
  },

  async mtoProfileUpdate(
    _root: undefined,
    { _id, ...doc }: { _id: string } & Partial<IProvider>,
    context: IContext,
  ) {
    const { models } = context;
    const provider = await models.Provider.findOne({ _id });

    if (!provider) {
      throw new Error('Profile not found');
    }

    validateProviderOwnershipByProvider(context, provider);

    if (provider.status === ProviderStatus.REJECTED) {
      throw new Error('Cannot update a rejected profile');
    }

    return await models.Provider.updateProvider(_id, { ...doc });
  },

  async mtoProfileApprove(
    _root: undefined,
    { _id, approvedBy }: { _id: string; approvedBy: string },
    context: IContext,
  ) {
    const { models } = context;
    const provider = await models.Provider.findOne({ _id });

    if (!provider) {
      throw new Error('Profile not found');
    }

    validateProviderOwnershipByProvider(context, provider);

    if (provider.status === ProviderStatus.APPROVED) {
      throw new Error('Profile is already approved');
    }

    return await models.Provider.approveProvider(_id, approvedBy);
  },

  async mtoProfileReject(
    _root: undefined,
    {
      _id,
      rejectionReason,
      rejectedBy,
    }: { _id: string; rejectionReason: string; rejectedBy: string },
    context: IContext,
  ) {
    const { models } = context;
    const provider = await models.Provider.findOne({ _id });

    if (!provider) {
      throw new Error('Profile not found');
    }

    validateProviderOwnershipByProvider(context, provider);

    if (provider.status === ProviderStatus.REJECTED) {
      throw new Error('Profile is already rejected');
    }

    return await models.Provider.rejectProvider(
      _id,
      rejectionReason,
      rejectedBy,
    );
  },

  async mtoProfilesRemove(
    _root: undefined,
    { ids }: { ids: string[] },
    context: IContext,
  ) {
    const { models } = context;

    if (ids && ids.length > 0) {
      const providers = await models.Provider.find({ _id: { $in: ids } });

      for (const provider of providers) {
        validateProviderOwnershipByProvider(context, provider);
      }
    }

    return await models.Provider.removeProviders(ids);
  },
};
