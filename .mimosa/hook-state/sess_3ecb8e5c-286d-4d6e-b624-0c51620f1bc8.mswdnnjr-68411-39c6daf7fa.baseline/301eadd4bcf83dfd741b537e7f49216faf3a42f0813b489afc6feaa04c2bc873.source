import { useMutation } from '@apollo/client';
import { BA_UPDATE_PRODUCT_STATUS } from '../graphql/mutations';

export const useUpdateProductStatus = () => {
  const [updateStatus, { loading }] = useMutation(BA_UPDATE_PRODUCT_STATUS, {
    refetchQueries: ['BaProducts'],
  });

  return { updateStatus, loading };
};
