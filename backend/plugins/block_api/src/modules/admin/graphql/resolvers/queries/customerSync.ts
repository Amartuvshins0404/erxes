import { IContext } from '~/connectionResolvers';

export const customerSyncQueries = {
  blockGetCustomerSync: async (
    _parent: undefined,
    { customerId }: { customerId: string },
    { models }: IContext,
  ) => {
    return models.CustomerSync.getCustomerSync(customerId);
  },
};
