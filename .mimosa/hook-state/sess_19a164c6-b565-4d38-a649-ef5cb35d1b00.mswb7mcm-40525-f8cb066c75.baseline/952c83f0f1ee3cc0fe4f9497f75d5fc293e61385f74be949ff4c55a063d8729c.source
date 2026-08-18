import { useQuery } from '@apollo/client';
import { GET_POSC_PRODUCTS } from '../graphql/posQueries';

export interface IPoscProduct {
  _id: string;
  name?: string;
  code?: string;
  unitPrice?: number;
  categoryId?: string;
  attachment?: { url?: string };
}

export const usePoscProducts = (params: {
  posToken: string | undefined;
  searchValue?: string;
  categoryId?: string;
  perPage?: number;
}) => {
  const { posToken, searchValue, categoryId, perPage = 50 } = params;

  const { data, loading, error, refetch } = useQuery(GET_POSC_PRODUCTS, {
    skip: !posToken,
    variables: { searchValue, categoryId, perPage },
    context: posToken
      ? { headers: { 'erxes-pos-token': posToken } }
      : undefined,
    fetchPolicy: 'cache-and-network',
  });

  return {
    products: (data?.poscProducts || []) as IPoscProduct[],
    loading,
    error,
    refetch,
  };
};
