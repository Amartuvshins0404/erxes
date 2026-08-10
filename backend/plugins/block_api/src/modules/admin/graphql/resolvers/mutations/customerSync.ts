import { syncCustomerToBlockAdmin } from '@/admin/utils';
import { IContext } from '~/connectionResolvers';

export const customerSyncMutations = {
  blockSyncCustomer: async (
    _parent: undefined,
    { customerId }: { customerId: string },
    { subdomain, models }: IContext & { subdomain: string },
  ) => {
    return syncCustomerToBlockAdmin(subdomain, customerId, models);
  },
};
