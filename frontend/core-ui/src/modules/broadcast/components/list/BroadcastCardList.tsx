import { Card, EnumCursorDirection, ScrollArea, Skeleton } from 'erxes-ui';
import { LoadMoreSentinel } from 'ui-modules';
import { useMessages } from '../../hooks/useBroadcastMessages';
import { BroadcastCard } from './BroadcastCard';
import { BroadcastEmptyState, BroadcastErrorState } from './BroadcastStates';

const INITIAL_SKELETON_COUNT = 8;

const BroadcastCardSkeleton = () => (
  <Card className="flex flex-col gap-4 border p-4">
    <Skeleton className="h-7 w-7 rounded-md" />
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-1 w-full" />
    <Skeleton className="h-3 w-1/2" />
  </Card>
);

export const BroadcastCardList = () => {
  const {
    messages,
    loading,
    initialLoading,
    error,
    refetch,
    hasNextPage,
    handleFetchMore,
  } = useMessages();

  if (error) {
    return <BroadcastErrorState error={error} onRetry={() => refetch()} />;
  }

  if (!loading && !messages.length) {
    return <BroadcastEmptyState />;
  }

  return (
    <ScrollArea.Root className="h-full w-full">
      <ScrollArea.Viewport>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-3 p-3">
          {messages.map((message) => (
            <BroadcastCard key={message._id} message={message} />
          ))}
          {initialLoading &&
            Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, index) => (
              <BroadcastCardSkeleton key={index} />
            ))}
        </div>
        <LoadMoreSentinel
          hasMore={!!hasNextPage}
          loading={loading}
          onLoadMore={() =>
            handleFetchMore({ direction: EnumCursorDirection.FORWARD })
          }
        />
      </ScrollArea.Viewport>
      <ScrollArea.Bar orientation="vertical" />
    </ScrollArea.Root>
  );
};
