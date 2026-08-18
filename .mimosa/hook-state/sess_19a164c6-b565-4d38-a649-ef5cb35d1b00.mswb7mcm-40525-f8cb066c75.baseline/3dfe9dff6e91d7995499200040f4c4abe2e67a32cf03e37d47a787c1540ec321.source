import { useQuery, QueryHookOptions } from '@apollo/client';
import { ONE_FIT_CUSTOMER } from '../graphql/onefitCustomerQueries';
import { OneFitCustomer } from '../types/onefitCustomer';

export const useOneFitCustomerDetail = (
  options: QueryHookOptions<{ oneFitCustomer: OneFitCustomer }>,
) => {
  const { data, loading, error, refetch } = useQuery<{
    oneFitCustomer: OneFitCustomer;
  }>(ONE_FIT_CUSTOMER, options);

  return {
    loading,
    oneFitCustomer: data?.oneFitCustomer,
    error,
    refetch,
  };
};
