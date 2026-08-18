import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { MEMBERSHIP_PURCHASES_CURSOR_SESSION_KEY } from '../constants/membershipPurchaseCursorSessionKey';
import { ONE_FIT_MEMBERSHIP_PURCHASES } from '../graphql/membershipPurchaseQueries';
import { MembershipPurchaseFilters } from '../types/membershipPurchase';

const MEMBERSHIP_PURCHASES_PER_PAGE = 20;

function buildOrderBy(filters?: MembershipPurchaseFilters) {
  const sortField = filters?.sortField || 'createdAt';
  const sortDirection = filters?.sortDirection || 'desc';
  const sortOrder = sortDirection === 'asc' ? 1 : -1;

  return {
    [sortField]: sortOrder,
  };
}

export function useMembershipPurchases(filters?: MembershipPurchaseFilters) {
  const { cursor } = useRecordTableCursor({
    sessionKey: MEMBERSHIP_PURCHASES_CURSOR_SESSION_KEY,
  });
  const orderBy = buildOrderBy(filters);

  const queryFilters =
    filters?.isPaidNotActivated === true
      ? {
          ...filters,
          status: 'paid',
          isActivated: false,
          orderBy,
        }
      : {
          ...filters,
          orderBy,
        };

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_MEMBERSHIP_PURCHASES,
    {
      variables: {
        ...queryFilters,
        cursor,
        limit: MEMBERSHIP_PURCHASES_PER_PAGE,
      },
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_MEMBERSHIP_PURCHASES, {
    variables: { limit: 1 },
  });

  const {
    list: membershipPurchases,
    totalCount,
    pageInfo,
  } = data?.oneFitMembershipPurchases || {};
  const overallTotalCount = overallData?.oneFitMembershipPurchases?.totalCount;

  const handleFetchMore = ({
    direction,
  }: {
    direction: EnumCursorDirection;
  }) => {
    if (!validateFetchMore({ direction, pageInfo })) return;

    fetchMore({
      variables: {
        ...queryFilters,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: MEMBERSHIP_PURCHASES_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitMembershipPurchases: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitMembershipPurchases,
            prevResult: prev.oneFitMembershipPurchases,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...queryFilters,
      cursor,
      limit: MEMBERSHIP_PURCHASES_PER_PAGE,
    });
  }, [refetch, queryFilters, cursor]);

  return {
    membershipPurchases,
    loading,
    error,
    totalCount,
    filteredTotalCount: totalCount,
    overallTotalCount,
    pageInfo,
    handleFetchMore,
    refetch: handleRefetch,
  };
}
