import { IProviderDocument } from '@/provider/@types/provider';
import { IContext } from '~/connectionResolvers';

const providerCustomResolvers = {
  MtoProvider: {
    categories: async (
      provider: IProviderDocument,
      _params: undefined,
      { models }: IContext,
    ) => {
      if (!provider.categoryIds?.length) return [];
      return models.Category.find({ _id: { $in: provider.categoryIds } });
    },
  },
};

export default providerCustomResolvers;
