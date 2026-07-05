import { memo } from 'react';
import { IconChevronLeft, IconClock } from '@tabler/icons-react';
import { Badge, Button, cn, RelativeDateDisplay, Skeleton } from 'erxes-ui';
import { ISchedule, SCHEDULE_STATUS_VARIANTS } from '~/pages/schedules/types';

// Scheduled-mode sidebar: the selected agent's schedules rendered as "sessions".
// Selecting one loads its run transcript into the shared chat message view.
// Read-only browsing — schedules are created/edited from the Schedules tab, so
// there is no "New" here (mirrors SessionList's shape otherwise).
const ScheduleItem = memo(
  ({
    schedule,
    active,
    onSelect,
  }: {
    schedule: ISchedule;
    active: boolean;
    onSelect: (scheduleId: string) => void;
  }) => (
    <button
      type="button"
      onClick={() => onSelect(schedule._id)}
      className={cn(
        'w-full text-left rounded-md px-2.5 py-2 transition-colors hover:bg-accent',
        active && 'bg-accent',
      )}
    >
      <p className="truncate text-sm">{schedule.name}</p>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {schedule.lastRunAt ? (
          <>
            <Badge
              variant={SCHEDULE_STATUS_VARIANTS[schedule.lastStatus ?? 'success']}
            >
              {schedule.lastStatus}
            </Badge>
            <RelativeDateDisplay value={schedule.lastRunAt} asChild>
              <span className="truncate">
                <RelativeDateDisplay.Value value={schedule.lastRunAt} />
              </span>
            </RelativeDateDisplay>
          </>
        ) : (
          <span>Never run</span>
        )}
      </div>
    </button>
  ),
);
ScheduleItem.displayName = 'ScheduleItem';

export const ScheduleSessionList = memo(
  ({
    schedules,
    loading,
    activeScheduleId,
    onSelect,
    onBack,
  }: {
    schedules: ISchedule[];
    loading: boolean;
    activeScheduleId?: string;
    onSelect: (scheduleId: string) => void;
    onBack?: () => void;
  }) => (
    <div className="flex flex-col h-full">
      <div className="px-2 py-2 border-b flex items-center gap-1">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onBack}
            title="Back to agents"
          >
            <IconChevronLeft className="size-3.5" />
          </Button>
        )}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Schedules
        </p>
      </div>
      <div className="ea-scroll flex-1 overflow-auto p-1.5 space-y-0.5">
        {loading ? (
          <div className="space-y-1.5 p-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-2.5 py-8 text-center text-muted-foreground">
            <IconClock className="size-5" />
            <p className="text-xs">No schedules for this agent.</p>
          </div>
        ) : (
          schedules.map((s) => (
            <ScheduleItem
              key={s._id}
              schedule={s}
              active={s._id === activeScheduleId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  ),
);
ScheduleSessionList.displayName = 'ScheduleSessionList';
