import { NetworkStatus, OperationVariables, useQuery } from '@apollo/client';
import { GET_APPS } from '../graphql';
import { IAppData } from '../types';

const APPS_PER_PAGE = 30;

export const useApps = (options?: OperationVariables) => {
  const { data, error, loading, fetchMore, networkStatus } = useQuery<IAppData>(
    GET_APPS,
    {
      ...options,
      variables: { ...options?.variables, page: 1, perPage: APPS_PER_PAGE },
      notifyOnNetworkStatusChange: true,
    },
  );
  const apps = data?.apps || [];
  const totalCount = data?.appsTotalCount || 0;
  const fetchingMore = networkStatus === NetworkStatus.fetchMore;
  const hasMore = apps.length < totalCount;

  const handleFetchMore = () => {
    if (!hasMore || fetchingMore) return;

    fetchMore({
      variables: { page: Math.floor(apps.length / APPS_PER_PAGE) + 1 },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        const known = new Set(prev.apps.map((app) => app._id));

        return {
          ...fetchMoreResult,
          apps: [
            ...prev.apps,
            ...fetchMoreResult.apps.filter((app) => !known.has(app._id)),
          ],
        };
      },
    });
  };

  return {
    apps,
    totalCount,
    error,
    loading: loading && !fetchingMore,
    fetchingMore,
    hasMore,
    handleFetchMore,
  };
};
