import { useGetOppty } from '@/oppty/hooks/useGetOppty';
import { IBlockStatus } from '@/status/types';
import { useBlockStatusesByType } from '@/status/hooks/useGetBlockStatuses';
import { Badge } from 'erxes-ui';
import {
  ActivityLogCustomActivity,
  ActivityLogs,
  TActivityLog,
  useActivityLog,
} from 'ui-modules';

const STATUS_TYPE_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'
> = {
  lead: 'secondary',
  qualified: 'info',
  matching: 'default',
  negotiation: 'warning',
  closed_won: 'success',
  closed_lost: 'destructive',
};

const StatusBadge = ({ status }: { status: IBlockStatus }) => (
  <Badge variant={STATUS_TYPE_VARIANT[status.type] || 'default'}>
    {status.name}
  </Badge>
);

const StatusActivityRow = ({ activity }: { activity: TActivityLog }) => {
  const { targetId } = useActivityLog();

  const { oppty } = useGetOppty({
    variables: { _id: targetId },
    skip: !targetId,
  });

  const { statuses } = useBlockStatusesByType({
    projectId: oppty?.projectId || '',
  });

  const { changes, metadata } = activity;
  const fieldLabel = metadata?.fieldLabel || 'Status';
  const prevId = changes?.prev?.status
    ? String(changes.prev.status)
    : undefined;
  const currentId = changes?.current?.status
    ? String(changes.current.status)
    : undefined;

  const findStatus = (id?: string) => statuses?.find((s) => s._id === id);

  const prevStatus = prevId ? findStatus(prevId) : undefined;
  const currentStatus = currentId ? findStatus(currentId) : undefined;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
        <ActivityLogs.ActorName activity={activity} />
        <span className="text-muted-foreground">changed</span>
        <span className="font-medium">{fieldLabel.toLowerCase()}</span>
        {prevStatus ? (
          <>
            <span className="text-muted-foreground">from</span>
            <StatusBadge status={prevStatus} />
          </>
        ) : prevId ? (
          <>
            <span className="text-muted-foreground">from</span>
            <span className="font-medium">{prevId}</span>
          </>
        ) : null}
        {currentStatus ? (
          <>
            <span className="text-muted-foreground">to</span>
            <StatusBadge status={currentStatus} />
          </>
        ) : currentId ? (
          <>
            <span className="text-muted-foreground">to</span>
            <span className="font-medium">{currentId}</span>
          </>
        ) : null}
      </div>
    </div>
  );
};

export const statusActivityLog: ActivityLogCustomActivity = {
  type: 'oppty.status_changed',
  render: (activity: TActivityLog) => <StatusActivityRow activity={activity} />,
};
