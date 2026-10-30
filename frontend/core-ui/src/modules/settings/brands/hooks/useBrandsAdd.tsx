import {
  MutationHookOptions,
  OperationVariables,
  useMutation,
} from '@apollo/client';
import { ADD_BRANDS } from '../graphql';
import { TAddBrandResult } from '../types';

export function useBrandsAdd(
  options?: MutationHookOptions<TAddBrandResult, OperationVariables>,
) {
  const [brandsAdd, { loading, error }] = useMutation(ADD_BRANDS, options);

  return {
    brandsAdd,
    loading,
    error,
  };
}
