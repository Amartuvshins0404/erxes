import { NetworkStatus, OperationVariables, useQuery } from '@apollo/client';
import { GET_OAUTH_CLIENTS } from '../graphql';
import { IOAuthClientAppData } from '../types';

const OAUTH_CLIENTS_PER_PAGE = 30;

export const useOAuthClients = (options?: OperationVariables) => {
  const { data, error, loading, fetchMore, networkStatus } =
    useQuery<IOAuthClientAppData>(GET_OAUTH_CLIENTS, {
      ...options,
      variables: {
        ...options?.variables,
        page: 1,
        perPage: OAUTH_CLIENTS_PER_PAGE,
      },
      notifyOnNetworkStatusChange: true,
    });
  const oauthClientApps = data?.oauthClientApps || [];
  const totalCount = data?.oauthClientAppsTotalCount || 0;
  const fetchingMore = networkStatus === NetworkStatus.fetchMore;
  const hasMore = oauthClientApps.length < totalCount;

  const handleFetchMore = () => {
    if (!hasMore || fetchingMore) return;

    fetchMore({
      variables: {
        page: Math.floor(oauthClientApps.length / OAUTH_CLIENTS_PER_PAGE) + 1,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        const known = new Set(prev.oauthClientApps.map((app) => app._id));

        return {
          ...fetchMoreResult,
          oauthClientApps: [
            ...prev.oauthClientApps,
            ...fetchMoreResult.oauthClientApps.filter(
              (app) => !known.has(app._id),
            ),
          ],
        };
      },
    });
  };

  return {
    oauthClientApps,
    totalCount,
    error,
    loading: loading && !fetchingMore,
    fetchingMore,
    hasMore,
    handleFetchMore,
  };
};
