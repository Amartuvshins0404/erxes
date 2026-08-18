import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  useMultiQueryState,
  validateFetchMore,
} from 'erxes-ui';
import { BA_PRODUCTS } from '../graphql/queries';
import { IProductList } from '../types';

export const useBaProductVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, status, supplierId, categoryId }] = useMultiQueryState<{
    searchValue: string;
    status: string;
    supplierId: string;
    categoryId: string;
  }>(['searchValue', 'status', 'supplierId', 'categoryId']);

  return {
    ...(variables || {}),
    searchValue: searchValue || undefined,
    status: status || undefined,
    supplierId: supplierId || undefined,
    categoryId: categoryId || undefined,
  };
};

export const useBaProducts = (options?: QueryHookOptions) => {
  const variables = useBaProductVariables(options?.variables);

  const { data, loading, fetchMore } = useQuery<{
    baProducts: IProductList;
  }>(BA_PRODUCTS, { ...options, variables });

  const { list: products, pageInfo, totalCount } = data?.baProducts || {};

  const handleFetchMore = ({
    direction = EnumCursorDirection.FORWARD,
  }: { direction?: EnumCursorDirection } = {}) => {
    if (!validateFetchMore({ direction, pageInfo })) return;

    fetchMore({
      variables: {
        ...variables,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: 20,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          baProducts: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.baProducts,
            prevResult: prev.baProducts,
          }),
        });
      },
    });
  };

  return { products, loading, pageInfo, totalCount, handleFetchMore };
};
