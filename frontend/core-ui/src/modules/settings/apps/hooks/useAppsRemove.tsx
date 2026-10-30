import { MutationHookOptions, useMutation } from '@apollo/client';
import { REMOVE_APP } from '../graphql';

export function useAppsRemove(
  options?: MutationHookOptions<{ appsRemove: string }, { _id: string }>,
) {
  const [appsRemove, { loading, error }] = useMutation<
    { appsRemove: string },
    { _id: string }
  >(REMOVE_APP, options);

  return {
    appsRemove,
    loading,
    error,
  };
}
