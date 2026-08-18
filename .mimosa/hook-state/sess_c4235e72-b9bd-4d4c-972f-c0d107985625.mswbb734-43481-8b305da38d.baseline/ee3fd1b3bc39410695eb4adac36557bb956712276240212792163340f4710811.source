import { useMutation } from '@apollo/client';
import { MUSHOP_CREATE_COLLECTIVE } from '../graphql/mutations';
import { MUSHOP_COLLECTIVES } from '../graphql/queries';

export const useCreateCollective = () => {
  const [mutate, { loading }] = useMutation(MUSHOP_CREATE_COLLECTIVE, {
    refetchQueries: [{ query: MUSHOP_COLLECTIVES }],
  });

  return { createCollective: mutate, loading };
};
