import { useQuery } from '@apollo/client';
import { useCallback } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  useRecordTableCursor,
  validateFetchMore,
} from 'erxes-ui';
import { MEMBERSHIP_PLANS_CURSOR_SESSION_KEY } from '../constants/membershipPlanCursorSessionKey';
import { ONE_FIT_MEMBERSHIP_PLANS } from '../graphql/membershipPlanQueries';
import { MembershipPlanFilters } from '../types/membership';

const MEMBERSHIP_PLANS_PER_PAGE = 20;

export const useMembershipPlans = (filters?: MembershipPlanFilters) => {
  const { cursor } = useRecordTableCursor({
    sessionKey: MEMBERSHIP_PLANS_CURSOR_SESSION_KEY,
  });

  const { data, loading, error, fetchMore, refetch } = useQuery(
    ONE_FIT_MEMBERSHIP_PLANS,
    {
      variables: {
        ...filters,
        cursor,
      },
    },
  );
  const { data: overallData } = useQuery(ONE_FIT_MEMBERSHIP_PLANS, {
    variables: { limit: 1 },
  });

  const {
    list: membershipPlans,
    totalCount,
    pageInfo,
  } = data?.oneFitMembershipPlans || {};
  const overallTotalCount = overallData?.oneFitMembershipPlans?.totalCount;

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

    fetchMore({
      variables: {
        ...filters,
        cursor:
          direction === EnumCursorDirection.FORWARD
            ? pageInfo?.endCursor
            : pageInfo?.startCursor,
        limit: MEMBERSHIP_PLANS_PER_PAGE,
        direction,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return Object.assign({}, prev, {
          oneFitMembershipPlans: mergeCursorData({
            direction,
            fetchMoreResult: fetchMoreResult.oneFitMembershipPlans,
            prevResult: prev.oneFitMembershipPlans,
          }),
        });
      },
    });
  };

  const handleRefetch = useCallback(() => {
    return refetch({
      ...filters,
      cursor,
    });
  }, [refetch, filters, cursor]);

  return {
    membershipPlans,
    loading,
    error,
    totalCount,
    filteredTotalCount: totalCount,
    overallTotalCount,
    pageInfo,
    handleFetchMore,
    refetch: handleRefetch,
  };
};
