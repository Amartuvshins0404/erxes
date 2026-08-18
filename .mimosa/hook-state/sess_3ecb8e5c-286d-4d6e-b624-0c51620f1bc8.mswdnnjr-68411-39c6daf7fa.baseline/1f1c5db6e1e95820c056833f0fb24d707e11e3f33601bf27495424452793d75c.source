import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_BLOCK_CONTRACT_STATUSES } from '@/contract-status/graphql/queries/getBlockContractStatuses';
import { IBlockContractStatus } from '@/contract-status/types';

interface IUseGetBlockContractStatusesResponse {
  getBlockContractStatuses: IBlockContractStatus[];
}

export const useBlockContractStatusesByType = ({
  projectId,
  type,
}: {
  projectId: string;
  type?: string;
}) => {
  const { data, loading, refetch } =
    useQuery<IUseGetBlockContractStatusesResponse>(GET_BLOCK_CONTRACT_STATUSES, {
      variables: { projectId },
      skip: !projectId,
    });

  const statuses = useMemo(() => {
    const all = data?.getBlockContractStatuses || [];

    if (!type) return all;

    return all.filter((status) => status.type === type);
  }, [data?.getBlockContractStatuses, type]);

  return { statuses, loading, refetch };
};
