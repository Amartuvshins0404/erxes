import { useMutation } from '@apollo/client';
import { DELETE_CV_CLIENT } from '../graphql/cvClientsMutation';

export const useClientsRemove = () => {
  const [removeClient, { loading }] = useMutation(DELETE_CV_CLIENT, {
    refetchQueries: ['GetCVClients'],
  });

  return { removeClient, loading };
};
