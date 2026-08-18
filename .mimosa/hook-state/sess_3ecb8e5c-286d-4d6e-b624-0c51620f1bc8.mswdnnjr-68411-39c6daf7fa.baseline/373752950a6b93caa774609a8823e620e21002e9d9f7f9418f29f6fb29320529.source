import { useQuery } from '@apollo/client';
import { BA_PRODUCT_DETAIL } from '../graphql/queries';
import { IBaProduct } from '../types';

export const useBaProductDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{
    baProductDetail: IBaProduct;
  }>(BA_PRODUCT_DETAIL, {
    variables: { _id },
    skip: !_id,
  });

  return { product: data?.baProductDetail ?? null, loading };
};
