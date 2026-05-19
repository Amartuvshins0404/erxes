import { useQuery } from '@apollo/client';
import { GET_CONTRACTS, GET_CONTRACT } from '../graphql/contractQueries';
import { IContract } from '@/contract/types/contractTypes';

export const useContracts = (unit?: string) => {
  const { data, loading, error, refetch } = useQuery<{
    blockGetContracts: IContract[];
  }>(GET_CONTRACTS, {
    variables: { unit },
  });

  return {
    contracts: data?.blockGetContracts,
    loading,
    error,
    refetch,
  };
};

export const useContract = (contractId?: string) => {
  const { data, loading, error } = useQuery<{
    blockGetContract: IContract;
  }>(GET_CONTRACT, {
    variables: { id: contractId },
    skip: !contractId,
  });

  return {
    contract: data?.blockGetContract,
    loading,
    error,
  };
};
