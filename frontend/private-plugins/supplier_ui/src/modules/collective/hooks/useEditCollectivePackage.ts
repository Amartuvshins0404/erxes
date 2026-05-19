import { useMutation } from '@apollo/client';
import { EDIT_COLLECTIVE_PACKAGE } from '../graphql/packageMutations';
import {
  GET_COLLECTIVE_PACKAGES,
  GET_COLLECTIVE_PACKAGE_DETAIL,
} from '../graphql/packageQueries';

export const useEditCollectivePackage = (id?: string | null) => {
  const [mutate, { loading }] = useMutation(EDIT_COLLECTIVE_PACKAGE, {
    refetchQueries: [
      { query: GET_COLLECTIVE_PACKAGES },
      ...(id
        ? [{ query: GET_COLLECTIVE_PACKAGE_DETAIL, variables: { _id: id } }]
        : []),
    ],
  });

  return { editPackage: mutate, loading };
};
