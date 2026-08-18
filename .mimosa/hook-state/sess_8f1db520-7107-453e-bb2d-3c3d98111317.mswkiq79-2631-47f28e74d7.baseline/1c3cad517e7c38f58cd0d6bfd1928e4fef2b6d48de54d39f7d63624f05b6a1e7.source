import { useMutation } from '@apollo/client';
import { CREATE_CV_CLIENT } from '../graphql/cvClientsMutation';
import { GET_CV_CLIENTS } from '../graphql/cvClientsQueries';

export const useClientsCreate = () => {
  const [createClient, { loading }] = useMutation(CREATE_CV_CLIENT, {
    refetchQueries: [GET_CV_CLIENTS],
  });

  return { createClient, loading };
};
