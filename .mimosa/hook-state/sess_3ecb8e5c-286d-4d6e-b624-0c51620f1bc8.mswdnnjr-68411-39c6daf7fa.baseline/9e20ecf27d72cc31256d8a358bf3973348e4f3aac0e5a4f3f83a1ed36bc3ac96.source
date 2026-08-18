import { cn } from 'erxes-ui';
import {
  ATTENDANCE_COLORS,
  ATTENDANCE_LABELS,
  ATTENDANCE_ORDER,
} from '~/lib/constants';
import { IAttendanceSummary, InvitationStatus } from '~/types/event';

export const AttendanceSummaryBar = ({
  summary,
  loading,
  selectedStatus,
  onSelectStatus,
}: {
  summary: IAttendanceSummary | null;
  loading: boolean;
  selectedStatus?: InvitationStatus;
  onSelectStatus?: (status?: InvitationStatus) => void;
}) => {
  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
        <div className="h-2.5 w-full animate-pulse rounded-full bg-accent" />
      </div>
    );
  }

  if (!summary || summary.total === 0) {
    return (
      <p className="flex min-w-0 flex-1 items-center text-sm text-muted-foreground">
        No responses yet. Counts appear here once members reply.
      </p>
    );
  }

  const counts = ATTENDANCE_ORDER.map(
    (status) =>
      summary.counts.find((entry) => entry.status === status) ?? {
        status,
        count: 0,
        percentage: 0,
      },
  ).filter((entry) => entry.count > 0);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-accent">
        {counts.map((entry) => (
          <div
            key={entry.status}
            style={{
              width: `${entry.percentage}%`,
              backgroundColor: ATTENDANCE_COLORS[entry.status],
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
        {counts.map((entry) => {
          const isSelected = selectedStatus === entry.status;

          return (
            <button
              key={entry.status}
              type="button"
              onClick={() =>
                onSelectStatus?.(isSelected ? undefined : entry.status)
              }
              className={cn(
                '-mx-1 flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs transition-colors hover:bg-accent',
                isSelected && 'bg-accent',
                selectedStatus && !isSelected && 'opacity-50',
              )}
            >
              <span
                aria-hidden
                className="size-2 flex-none rounded-full"
                style={{ backgroundColor: ATTENDANCE_COLORS[entry.status] }}
              />
              <span className="font-medium text-foreground">
                {entry.count}
              </span>
              <span className="text-muted-foreground">
                {ATTENDANCE_LABELS[entry.status]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
