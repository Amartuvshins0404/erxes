import { useMutation, MutationHookOptions } from '@apollo/client';
import { CREATE_BLOCK_CONTRACT_STATUS } from '@/contract-status/graphql/mutations/createBlockContractStatus';
import { GET_BLOCK_CONTRACT_STATUSES } from '@/contract-status/graphql/queries/getBlockContractStatuses';
import { useToast } from 'erxes-ui';

export const useAddBlockContractStatus = () => {
  const { toast } = useToast();
  const [_createBlockContractStatus, { loading, error }] = useMutation(
    CREATE_BLOCK_CONTRACT_STATUS,
  );

  const addStatus = (options: MutationHookOptions) => {
    return _createBlockContractStatus({
      update: (cache, { data }) => {
        const input = options?.variables?.input;
        const existingData = cache.readQuery({
          query: GET_BLOCK_CONTRACT_STATUSES,
          variables: {
            projectId: input?.projectId,
          },
        }) as { getBlockContractStatuses: any[] } | null;

        if (existingData && data?.createBlockContractStatus) {
          cache.writeQuery({
            query: GET_BLOCK_CONTRACT_STATUSES,
            variables: {
              projectId: input?.projectId,
            },
            data: {
              getBlockContractStatuses: [
                ...existingData.getBlockContractStatuses,
                data.createBlockContractStatus,
              ],
            },
          });
        }
      },
      onError: (e) => {
        toast({
          title: 'Error',
          description: e.message,
          variant: 'destructive',
        });
      },
      ...options,
    });
  };

  return { addStatus, loading, error };
};
