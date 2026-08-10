import {
  DocumentNode,
  OperationVariables,
  QueryHookOptions,
  TypedDocumentNode,
  useQuery,
} from '@apollo/client';
import { useAtomValue } from 'jotai';
import { currentUserState } from 'ui-modules';

/**
 * `useQuery` for list / index screens, gated on auth hydration.
 *
 * WHY: on the first in-app navigation a list query can fire before `currentUser`
 * has hydrated. The resolver then errors or returns an empty list, and — with a
 * `network-only` policy and no `skip` gate — that empty result sticks with no
 * retry, so the page shows a permanent empty state until a hard refresh. Gating
 * the fetch on `currentUserId` (and reporting `loading` until it exists) makes
 * the query wait for auth, then fetch once, cleanly. See PR #278.
 *
 * `rawLoading` is the underlying query's loading flag, untouched by the auth OR.
 * Pagination `fetchMore` guards must use `rawLoading`, not `loading` — see
 * `handleFetchMore` in `useMastraAgentList`, which would otherwise never page
 * because `!currentUserId` forces `loading` true.
 */
export const useAuthedListQuery = <
  TData,
  TVariables extends OperationVariables = OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>,
) => {
  const currentUserId = useAtomValue(currentUserState)?._id;
  const result = useQuery<TData, TVariables>(query, {
    ...options,
    skip: options?.skip || !currentUserId,
  });
  return {
    ...result,
    loading: result.loading || !currentUserId,
    rawLoading: result.loading,
  };
};
