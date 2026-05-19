import { useMutation } from '@apollo/client';
import { UPDATE_GET_COLLECTIVE } from '../graphql/mutations';
import { GET_COLLECTIVE } from '../graphql/queries';

export const useUpdateCollective = () => {
  const [mutate, { loading }] = useMutation(UPDATE_GET_COLLECTIVE, {
    refetchQueries: [{ query: GET_COLLECTIVE }],
  });
  return { updateCollective: mutate, loading };
};
