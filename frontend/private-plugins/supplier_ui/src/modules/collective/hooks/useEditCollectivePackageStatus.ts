import { useMutation } from '@apollo/client';
import { EDIT_COLLECTIVE_PACKAGE_STATUS } from '../graphql/packageMutations';
import { GET_COLLECTIVE_PACKAGES } from '../graphql/packageQueries';

export const useEditCollectivePackageStatus = () => {
  const [mutate, { loading }] = useMutation(EDIT_COLLECTIVE_PACKAGE_STATUS, {
    refetchQueries: [{ query: GET_COLLECTIVE_PACKAGES }],
  });

  return { editStatus: mutate, loading };
};
