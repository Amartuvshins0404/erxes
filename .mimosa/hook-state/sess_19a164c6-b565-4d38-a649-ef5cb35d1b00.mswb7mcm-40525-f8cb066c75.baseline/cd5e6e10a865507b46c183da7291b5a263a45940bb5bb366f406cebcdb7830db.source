import { useQuery } from '@apollo/client';
import { GET_BLOCK_CONTRACT_STATUS_TYPES } from '@/contract-status/graphql/queries/getBlockContractStatusTypes';
import { IBlockContractStatus } from '@/contract-status/types';

interface IResponse {
  getBlockContractStatusTypes: IBlockContractStatus[];
}

export const useBlockContractStatusTypes = () => {
  const { data, loading } = useQuery<IResponse>(GET_BLOCK_CONTRACT_STATUS_TYPES);

  return {
    statusTypes: data?.getBlockContractStatusTypes || [],
    loading,
  };
};
