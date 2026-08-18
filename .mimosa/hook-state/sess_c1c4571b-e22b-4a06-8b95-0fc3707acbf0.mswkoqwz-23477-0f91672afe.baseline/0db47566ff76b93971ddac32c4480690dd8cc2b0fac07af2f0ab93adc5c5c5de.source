import { useMutation, MutationHookOptions } from '@apollo/client';
import { CREATE_BLOCK_STATUS } from '@/status/graphql/mutations/createBlockStatus';
import { GET_BLOCK_STATUSES } from '@/status/graphql/queries/getBlockStatuses';
import { useToast } from 'erxes-ui';

export const useAddBlockStatus = () => {
  const { toast } = useToast();
  const [_createBlockStatus, { loading, error }] =
    useMutation(CREATE_BLOCK_STATUS);

  const addStatus = (options: MutationHookOptions) => {
    return _createBlockStatus({
      update: (cache, { data }) => {
        const input = options?.variables?.input;
        const existingData = cache.readQuery({
          query: GET_BLOCK_STATUSES,
          variables: {
            type: input?.type,
            projectId: input?.projectId,
          },
        }) as { getBlockOpptyStatuses: any[] } | null;

        if (existingData && data?.createBlockOpptyStatus) {
          cache.writeQuery({
            query: GET_BLOCK_STATUSES,
            variables: {
              type: input?.type,
              projectId: input?.projectId,
            },
            data: {
              getBlockOpptyStatuses: [
                ...existingData.getBlockOpptyStatuses,
                data.createBlockOpptyStatus,
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
