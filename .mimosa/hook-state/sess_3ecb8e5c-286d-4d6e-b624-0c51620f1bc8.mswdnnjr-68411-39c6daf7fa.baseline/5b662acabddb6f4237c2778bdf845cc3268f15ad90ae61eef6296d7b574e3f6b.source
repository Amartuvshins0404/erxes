import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_BLOCK_STATUSES } from '@/status/graphql/queries/getBlockStatuses';
import { IBlockStatus } from '@/status/types';

interface IUseGetBlockStatusesResponse {
  getBlockOpptyStatuses: IBlockStatus[];
}

export const useBlockStatusesByType = ({
  projectId,
  type,
}: {
  projectId: string;
  type?: string;
}) => {
  const { data, loading, refetch } = useQuery<IUseGetBlockStatusesResponse>(
    GET_BLOCK_STATUSES,
    {
      variables: {
        projectId,
      },
      skip: !projectId,
    },
  );

  console.log('data', data?.getBlockOpptyStatuses || [])

  const statuses = useMemo(() => {
    const all = data?.getBlockOpptyStatuses || [];

    if (!type) return all;

    return all.filter((status) => status.type === type);
  }, [data?.getBlockOpptyStatuses, type]);

  console.log('statuses', statuses)

  return { statuses, loading, refetch };
};
