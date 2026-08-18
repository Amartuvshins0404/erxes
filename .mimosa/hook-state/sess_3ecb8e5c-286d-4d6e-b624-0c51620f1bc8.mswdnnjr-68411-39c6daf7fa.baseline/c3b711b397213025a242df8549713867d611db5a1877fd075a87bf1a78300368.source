import { useMutation, useQuery } from '@apollo/client';
import {
  GET_CUSTOMER_SYNC,
} from '@/admin/graphql/customerSyncQueries';
import { SYNC_CUSTOMER } from '@/admin/graphql/customerSyncMutations';
import { IBlockCustomerSync } from '@/admin/types/customerSync';

export const useCustomerSync = (customerId?: string) => {
  const { data, loading, refetch } = useQuery<{
    blockGetCustomerSync: IBlockCustomerSync | null;
  }>(GET_CUSTOMER_SYNC, {
    variables: { customerId },
    skip: !customerId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    customerSync: data?.blockGetCustomerSync,
    loading,
    refetch,
  };
};

export const useSyncCustomer = () => {
  const [syncCustomer, { loading }] = useMutation<{
    blockSyncCustomer: IBlockCustomerSync;
  }>(SYNC_CUSTOMER);

  return { syncCustomer, loading };
};
