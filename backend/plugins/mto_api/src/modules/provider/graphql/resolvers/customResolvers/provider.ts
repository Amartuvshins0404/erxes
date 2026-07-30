import { IProviderDocument } from '@/provider/@types/provider';
import { IContext } from '~/connectionResolvers';

const providerCustomResolvers = {
  MtoProvider: {
    associations: async (
      provider: IProviderDocument,
      _params: undefined,
      { models }: IContext,
    ) => {
      if (!provider.associationIds?.length) return [];
      return models.Association.find({ _id: { $in: provider.associationIds } });
    },
  },
};

export default providerCustomResolvers;
