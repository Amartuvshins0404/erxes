import { OperationVariables } from '@apollo/client';
import { useCursorListQuery, useMultiQueryState } from 'erxes-ui';
import { GET_BRANDS } from '../graphql';
import { IBrand } from '../types';

const BRANDS_LIMIT = 30;

export const useBrandsVariables = (options?: OperationVariables) => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
  }>(['searchValue']);
  return {
    ...options?.variables,
    searchValue: queries?.searchValue,
    limit: BRANDS_LIMIT,
    orderBy: {
      createdAt: -1,
    },
  };
};

export const useBrands = (options?: OperationVariables) => {
  const { limit, ...variables } = useBrandsVariables(options);
  const { list, ...rest } = useCursorListQuery<IBrand>(GET_BRANDS, {
    field: 'brands',
    variables,
    limit,
  });

  return {
    brands: list,
    ...rest,
  };
};
