import { useQuery } from '@apollo/client';
import { MUSHOP_PRODUCT_DETAIL } from '../graphql/queries';
import { IMushopProduct } from '../types';

export const useMushopProductDetail = (_id?: string | null) => {
  const { data, loading } = useQuery<{
    mushopProductDetail: IMushopProduct;
  }>(MUSHOP_PRODUCT_DETAIL, {
    variables: { _id },
    skip: !_id,
  });

  return { product: data?.mushopProductDetail ?? null, loading };
};
