import { SEGMENT_BROADCASTS } from '@/segments/graphql/segmentBroadcastsQueries';
import { EnumCursorDirection, useCursorListQuery } from 'erxes-ui';
import { ISegment } from 'ui-modules';

export type TSegmentBroadcast = {
  _id: string;
  title?: string;
  isLive?: boolean;
  isDraft?: boolean;
  scheduleDate?: { type?: string } | null;
};

export const useSegmentBroadcasts = (segment?: ISegment) => {
  const { list, initialLoading, loading, hasNextPage, handleFetchMore } =
    useCursorListQuery<TSegmentBroadcast>(SEGMENT_BROADCASTS, {
      field: 'engageMessages',
      variables: { segmentId: segment?._id },
      skip: !segment?._id,
      fetchPolicy: 'cache-and-network',
    });

  return {
    broadcasts: list,
    loading: initialLoading,
    fetchingMore: loading,
    hasNextPage: !!hasNextPage,
    fetchMore: () =>
      handleFetchMore({ direction: EnumCursorDirection.FORWARD }),
  };
};
