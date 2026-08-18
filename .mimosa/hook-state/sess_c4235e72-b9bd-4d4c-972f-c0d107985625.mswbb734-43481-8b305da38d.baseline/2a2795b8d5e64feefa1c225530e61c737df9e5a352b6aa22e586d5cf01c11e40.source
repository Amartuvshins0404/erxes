import { QueryHookOptions, useQuery } from '@apollo/client';
import {
  EnumCursorDirection,
  mergeCursorData,
  useMultiQueryState,
  validateFetchMore,
} from 'erxes-ui';
import { MUSHOP_PRODUCTS } from '../graphql/queries';
import { IProductList } from '../types';

export const useMushopProductVariables = (
  variables?: QueryHookOptions['variables'],
) => {
  const [{ searchValue, status, supplierId, categoryId }] =
    useMultiQueryState<{
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

export const useMushopProducts = (options?: QueryHookOptions) => {
  const variables = useMushopProductVariables(options?.variables);

  const { data, loading, fetchMore } = useQuery<{
    mushopProducts: IProductList;
  }>(MUSHOP_PRODUCTS, { ...options, variables });

  const { list: products, pageInfo, totalCount } =
    data?.mushopProducts || {};

  const handleFetchMore = ({
    direction = EnumCursorDirection.FORWARD,
  }: { direction: EnumCursorDirection } = { direction: EnumCursorDirection.FORWARD }) => {
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
          mushopProducts: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mushopProducts,
            prevResult: prev.mushopProducts,
          }),
        });
      },
    });
  };

  return { products, loading, pageInfo, totalCount, handleFetchMore };
};
