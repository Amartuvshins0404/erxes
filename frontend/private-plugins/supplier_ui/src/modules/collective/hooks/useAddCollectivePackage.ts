import { useMutation } from '@apollo/client';
import { ADD_COLLECTIVE_PACKAGE } from '../graphql/packageMutations';
import { GET_COLLECTIVE_PACKAGES } from '../graphql/packageQueries';

export const useAddCollectivePackage = () => {
  const [mutate, { loading }] = useMutation(ADD_COLLECTIVE_PACKAGE, {
    refetchQueries: [{ query: GET_COLLECTIVE_PACKAGES }],
  });

  return { addPackage: mutate, loading };
};
