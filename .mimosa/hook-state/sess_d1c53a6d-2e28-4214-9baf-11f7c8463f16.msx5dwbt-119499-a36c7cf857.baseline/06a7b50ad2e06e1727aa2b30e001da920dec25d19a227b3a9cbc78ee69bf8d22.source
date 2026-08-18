import { useMutation } from '@apollo/client';
import { UPDATE_OPPTY_MUTATION } from '@/oppty/graphql/mutations/updateOppty';
import { GET_OPPTY } from '@/oppty/graphql/queries/getOppty';
import { toast } from 'erxes-ui';

export const useUpdateOppty = ({ _id }: { _id?: string } = {}) => {
  const [updateOppty, { loading }] = useMutation(UPDATE_OPPTY_MUTATION, {
    refetchQueries: [
      'BlockGetOpptys',
      ...(_id
        ? [{ query: GET_OPPTY, variables: { _id } }]
        : []),
    ],
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Opportunity updated successfully',
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { updateOppty, loading };
};
