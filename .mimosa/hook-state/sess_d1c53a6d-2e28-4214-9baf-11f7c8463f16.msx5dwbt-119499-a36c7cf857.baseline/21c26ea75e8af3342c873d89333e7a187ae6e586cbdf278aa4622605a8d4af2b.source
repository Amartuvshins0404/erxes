import { useMutation } from '@apollo/client';
import { UPDATE_GET_SUPPLIER } from '../graphql/mutations';
import { GET_SUPPLIER } from '../graphql/queries';

export const useUpdateSupplier = () => {
  const [mutate, { loading }] = useMutation(UPDATE_GET_SUPPLIER, {
    refetchQueries: [{ query: GET_SUPPLIER }],
  });
  return { updateSupplier: mutate, loading };
};
