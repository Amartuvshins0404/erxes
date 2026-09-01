import { useQuery } from '@apollo/client';
import { useCallback, useMemo } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useNonNullMultiQueryState,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { PROFILES_CURSOR_SESSION_KEY } from '@/profile/constants/profilesCursorSessionKey';
import { MTO_PROFILES } from '@/profile/graphql/profileQueries';
import { MtoProfile, ProfileStatus } from '@/profile/types/profile';

const PROFILES_PER_PAGE = 100;

const parseBooleanQuery = (value?: string): boolean | undefined => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

export function useProfiles() {
  const { cursor } = useRecordTableCursor({
    sessionKey: PROFILES_CURSOR_SESSION_KEY,
  });
  const { searchValue, status, isActive } = useNonNullMultiQueryState<{
    searchValue: string;
    status: string;
    isActive: string;
  }>(['searchValue', 'status', 'isActive']);

  const filters = useMemo(
    () => ({
      searchValue: searchValue || undefined,
      status: (status as ProfileStatus | undefined) || undefined,
      isActive: parseBooleanQuery(isActive),
    }),
    [searchValue, status, isActive],
  );

  const { data, loading, refetch, fetchMore } = useQuery(MTO_PROFILES, {
    variables: {
      ...filters,
      cursor,
      limit: PROFILES_PER_PAGE,
    },
    fetchPolicy: 'cache-and-network',
  });

  const {
    list: profiles,
    totalCount,
    pageInfo,
  }: {
    list?: MtoProfile[];
    totalCount?: number;
    pageInfo?: {
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string;
      endCursor?: string;
    };
  } = data?.mtoProfiles || {};

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (
      !validateFetchMore({
        direction,
        pageInfo,
      })
    ) {
      return;
    }

    void fetchMore({
      variables: {
        ...filters,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: PROFILES_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          mtoProfiles: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.mtoProfiles,
            prevResult: prev.mtoProfiles,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
      cursor,
      limit: PROFILES_PER_PAGE,
    });
  }, [refetch, filters, cursor]);

  return {
    profiles: profiles ?? [],
    loading,
    refetch: handleRefetch,
    handleFetchMore,
    pageInfo,
    totalCount,
  };
}
