import { AutomationCard } from '@/automations/components/list/AutomationCard';
import { AutomationExecutionCountsLoader } from '@/automations/components/list/AutomationExecutionCountCell';
import { IAutomation } from '@/automations/types';
import { Card, EnumCursorDirection, ScrollArea, Skeleton } from 'erxes-ui';
import { LoadMoreSentinel } from 'ui-modules';

const INITIAL_SKELETON_COUNT = 8;

const AutomationCardSkeleton = () => (
  <Card className="flex flex-col gap-3 border p-4">
    <Skeleton className="h-4 w-2/3" />
    <Skeleton className="h-[3.25rem] w-full" />
    <Skeleton className="h-3 w-1/3" />
  </Card>
);

export const AutomationsCardList = ({
  list,
  loading,
  hasNextPage,
  handleFetchMore,
}: {
  list: IAutomation[];
  loading: boolean;
  hasNextPage?: boolean;
  handleFetchMore: ({ direction }: { direction: EnumCursorDirection }) => void;
}) => (
  <>
    <AutomationExecutionCountsLoader
      automationIds={list.map(({ _id }) => _id)}
    />
    <ScrollArea.Root className="h-full w-full">
      <ScrollArea.Viewport>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-3 p-3">
          {list.map((automation) => (
            <AutomationCard key={automation._id} automation={automation} />
          ))}
          {loading &&
            !list.length &&
            Array.from({ length: INITIAL_SKELETON_COUNT }).map((_, index) => (
              <AutomationCardSkeleton key={index} />
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
  </>
);
