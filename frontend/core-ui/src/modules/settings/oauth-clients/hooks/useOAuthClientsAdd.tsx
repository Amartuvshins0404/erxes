import {
  MutationHookOptions,
  OperationVariables,
  useMutation,
} from '@apollo/client';
import { ADD_OAUTH_CLIENT } from '../graphql';
import { IOAuthClientApp } from '../types';

export function useOAuthClientsAdd(
  options?: MutationHookOptions<
    { oauthClientAppsAdd: IOAuthClientApp },
    OperationVariables
  >,
) {
  const [oauthClientAppsAdd, { loading, error }] = useMutation<
    { oauthClientAppsAdd: IOAuthClientApp },
    OperationVariables
  >(
    ADD_OAUTH_CLIENT,
    options,
  );

  return {
    oauthClientAppsAdd,
    loading,
    error,
  };
}
