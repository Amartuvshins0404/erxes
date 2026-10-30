import { IconActivity } from '@tabler/icons-react';
import { Empty, EnumCursorDirection, Skeleton } from 'erxes-ui';
import { useInView } from 'react-intersection-observer';
import { useActivityLog } from '../context/ActivityLogProvider';
import { ActivityLogLoading } from './ActivityLogLoading';
import { ActivityLogRow } from './ActivityLogRow';
import { LoadMoreSentinel } from '../../shared/components/LoadMoreSentinel';

const ActivityLogRowsSkeleton = () => (
  <div className="w-full flex flex-col gap-4">
    {[...Array(4)].map((_, index) => (
      <div key={index} className="flex gap-2 items-center">
        <Skeleton className="size-6 rounded-full" />
        <Skeleton className="w-1/2 h-3" />
        <Skeleton className="w-20 ml-auto h-3" />
      </div>
    ))}
  </div>
);

export const ActivityLogList = ({
  emptyMessage,
}: {
  emptyMessage?: string;
}) => {
  const {
    activityLogs,
    loading,
    handleFetchMore,
    hasNextPage,
    hasPreviousPage,
    variant = 'forward',
    showExactDate,
  } = useActivityLog();

  const isBackward = variant === 'backward';
  const canFetchMore = Boolean(
    handleFetchMore && (isBackward ? hasPreviousPage : hasNextPage),
  );

  const fetchMore = () =>
    handleFetchMore?.({
      direction: isBackward
        ? EnumCursorDirection.BACKWARD
        : EnumCursorDirection.FORWARD,
    });

  const { ref: backwardRef } = useInView({
    threshold: 0.1,
    skip: !isBackward || !canFetchMore,
    onChange: (inView) => {
      if (inView && !loading) fetchMore();
    },
  });

  if (loading && (!activityLogs || activityLogs.length === 0)) {
    return <ActivityLogLoading />;
  }

  if (!activityLogs || activityLogs.length === 0) {
    return (
      <Empty>
        <Empty.Header>
          <Empty.Media variant="icon">
            <IconActivity />
          </Empty.Media>
          <Empty.Title>{emptyMessage || 'No activity logs found'}</Empty.Title>
          <Empty.Description>
            There seems to be no activity logs for this item.
          </Empty.Description>
        </Empty.Header>
      </Empty>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {isBackward && canFetchMore && (
        <div ref={backwardRef}>
          <ActivityLogRowsSkeleton />
        </div>
      )}
      {activityLogs.map((activity, index) => (
        <ActivityLogRow
          key={activity._id}
          activity={activity}
          isLast={index === activityLogs.length - 1}
          showExactDate={showExactDate}
        />
      ))}
      {!isBackward && (
        <LoadMoreSentinel
          key={activityLogs.length}
          hasMore={canFetchMore}
          loading={loading}
          onLoadMore={fetchMore}
        />
      )}
    </div>
  );
};
