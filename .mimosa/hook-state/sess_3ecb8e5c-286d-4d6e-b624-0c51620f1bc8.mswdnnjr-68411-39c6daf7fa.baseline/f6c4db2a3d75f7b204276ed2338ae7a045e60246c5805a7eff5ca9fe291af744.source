import { useMutation } from '@apollo/client';
import { useToast } from 'erxes-ui';
import { BLOCK_SUBMISSION_REMOVE } from '../graphql/mutations';
import { BLOCK_GET_SUBMISSIONS } from '../graphql/queries';

export const useRemoveSubmissions = (_ids: string[]) => {
  const { toast } = useToast();

  const [removeSubmissions] = useMutation(BLOCK_SUBMISSION_REMOVE, {
    variables: {
      _ids,
    },
    refetchQueries: [BLOCK_GET_SUBMISSIONS],
    onCompleted: () => {
      toast({ title: 'Submissions removed successfully', variant: 'success' });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error?.message,
        variant: 'destructive',
      });
    },
  });

  return {
    removeSubmissions,
  };
};
