import { useMutation } from '@apollo/client';
import { MUSHOP_UPDATE_PRODUCT_STATUS } from '../graphql/mutations';

export const useUpdateProductStatus = () => {
  const [updateStatus, { loading }] = useMutation(
    MUSHOP_UPDATE_PRODUCT_STATUS,
    {
      refetchQueries: ['MushopProducts', 'MushopProductsTotalCount'],
    },
  );

  return { updateStatus, loading };
};
