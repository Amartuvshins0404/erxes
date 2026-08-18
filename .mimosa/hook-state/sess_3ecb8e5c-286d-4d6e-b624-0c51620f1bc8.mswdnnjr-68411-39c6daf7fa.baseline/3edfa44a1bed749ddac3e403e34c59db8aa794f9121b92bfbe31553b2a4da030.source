import { useQuery } from '@apollo/client';
import { GET_CONTRACTS_LIST } from '../graphql/contractQueries';
import { IContract } from '../types/contractTypes';

interface ICustomerContractsResponse {
  blockGetContractsList: {
    list: IContract[];
    totalCount: number;
  };
}

const CUSTOMER_CONTRACTS_LIMIT = 20;

export const useCustomerContracts = (customerId?: string) => {
  const { data, loading, refetch } = useQuery<ICustomerContractsResponse>(
    GET_CONTRACTS_LIST,
    {
      variables: {
        filter: { customerId },
        limit: CUSTOMER_CONTRACTS_LIMIT,
        cursor: '',
        direction: 'forward',
      },
      skip: !customerId,
      fetchPolicy: 'cache-and-network',
    },
  );

  return {
    contracts: data?.blockGetContractsList?.list || [],
    loading,
    refetch,
  };
};
