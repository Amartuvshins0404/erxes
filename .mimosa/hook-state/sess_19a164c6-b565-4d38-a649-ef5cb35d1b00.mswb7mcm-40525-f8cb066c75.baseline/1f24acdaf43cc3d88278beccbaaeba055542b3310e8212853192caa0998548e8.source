import { useQuery } from '@apollo/client';
import { GET_BLOCK_STATUS_TYPES } from '@/status/graphql/queries/getBlockStatusTypes';
import { IBlockStatus } from '@/status/types';

interface IResponse {
  getBlockOpptyStatusTypes: IBlockStatus[];
}

export const useBlockStatusTypes = (projectId: string) => {
  const { data, loading } = useQuery<IResponse>(GET_BLOCK_STATUS_TYPES, {
    variables: { projectId },
  });

  return { statusTypes: data?.getBlockOpptyStatusTypes || [], loading };
};
