import { useMutation } from '@apollo/client';
import { UPDATE_CV_CLIENT } from '../graphql/cvClientsMutation';
import { GET_CV_CLIENT_DETAIL } from '../graphql/cvClientsQueries';
import { toast } from 'erxes-ui';

export const useClientsUpdate = ({ id }: { id: string }) => {
  const [updateClient, { loading }] = useMutation(UPDATE_CV_CLIENT, {
    refetchQueries: [
      'GetCVClients',
      { query: GET_CV_CLIENT_DETAIL, variables: { id } },
    ],
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Client updated successfully',
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

  return { updateClient, loading };
};
