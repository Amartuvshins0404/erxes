import { MutationHookOptions, useMutation } from '@apollo/client';
import { REMOVE_OAUTH_CLIENT } from '../graphql';

export function useOAuthClientsRemove(
  options?: MutationHookOptions<
    { oauthClientAppsRemove: string },
    { _id: string }
  >,
) {
  const [oauthClientAppsRemove, { loading, error }] = useMutation<
    { oauthClientAppsRemove: string },
    { _id: string }
  >(
    REMOVE_OAUTH_CLIENT,
    options,
  );

  return {
    oauthClientAppsRemove,
    loading,
    error,
  };
}
