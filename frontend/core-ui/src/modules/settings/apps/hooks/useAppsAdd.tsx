import { MutationHookOptions, useMutation } from '@apollo/client';
import { ADD_APP } from '../graphql';
import { IApp } from '../types';

export function useAppsAdd(
  options?: MutationHookOptions<{ appsAdd: IApp }, { name: string }>,
) {
  const [appsAdd, { loading, error }] = useMutation<
    { appsAdd: IApp },
    { name: string }
  >(ADD_APP, options);

  return {
    appsAdd,
    loading,
    error,
  };
}
