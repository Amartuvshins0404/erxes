import { useQuery } from '@apollo/client';
import { useState } from 'react';
import {
  EnumCursorDirection,
  mergeCursorData,
  validateFetchMore,
} from 'erxes-ui';
import { EVENT_INVITATIONS } from '@/events/graphql/queries';
import { IEventInvitationList, InvitationStatus } from '~/types/event';

const INVITATIONS_PER_PAGE = 20;

export const useEventInvitations = (
  eventId?: string | null,
  status?: InvitationStatus,
) => {
  const variables = { eventId, status, limit: INVITATIONS_PER_PAGE };
  const [fetchingMore, setFetchingMore] = useState(false);

  const { data, loading, error, fetchMore } = useQuery<{
    eventInvitations: IEventInvitationList;
  }>(EVENT_INVITATIONS, {
    variables,
    skip: !eventId,
  });

  const {
    list: invitations,
    totalCount,
    pageInfo,
  } = data?.eventInvitations || {};

  const handleFetchMore = () => {
    if (
      fetchingMore ||
      !validateFetchMore({ direction: EnumCursorDirection.FORWARD, pageInfo })
    ) {
      return;
    }

    setFetchingMore(true);

    fetchMore({
      variables: {
        ...variables,
        cursor: pageInfo?.endCursor,
        direction: EnumCursorDirection.FORWARD,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return prev;
        }

        const merged = mergeCursorData({
          direction: EnumCursorDirection.FORWARD,
          fetchMoreResult: fetchMoreResult.eventInvitations,
          prevResult: prev.eventInvitations,
        });

        return {
          ...prev,
          eventInvitations: {
            ...fetchMoreResult.eventInvitations,
            list: merged.list,
            pageInfo: merged.pageInfo,
          },
        };
      },
    }).finally(() => setFetchingMore(false));
  };

  return {
    invitations: invitations || [],
    totalCount: totalCount ?? 0,
    hasMore: !!pageInfo?.hasNextPage,
    loading,
    fetchingMore,
    handleFetchMore,
    error,
  };
};
