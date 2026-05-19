import { Badge } from 'erxes-ui';
import {
  ActivityLogCustomActivity,
  ActivityLogs,
  TActivityLog,
} from 'ui-modules';
import { useBlockContractStatusesByType } from '@/contract-status/hooks/useGetBlockContractStatuses';
import { useParams } from 'react-router-dom';

const STATUS_TYPE_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'destructive' | 'info' | 'secondary'
> = {
  reserved: 'warning',
  draft: 'secondary',
  signed: 'success',
  cancelled: 'destructive',
  lost: 'destructive',
};

const StageBadge = ({
  value,
  stages,
}: {
  value: string;
  stages: Array<{ _id: string; type: string; name: string }>;
}) => {
  const match = stages.find((s) => s._id === value);
  if (match) {
    return (
      <Badge variant={STATUS_TYPE_VARIANT[match.type] || 'default'}>
        {match.name}
      </Badge>
    );
  }
  return <Badge variant="default">{value}</Badge>;
};

const StatusActivityRow = ({ activity }: { activity: TActivityLog }) => {
  const { changes, metadata } = activity;
  const fieldLabel = metadata?.fieldLabel || 'Status';
  const prev = changes?.prev?.status as string | undefined;
  const current = changes?.current?.status as string | undefined;

  const { projectId: projectIdParam, id } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || id || '';
  const { statuses = [] } = useBlockContractStatusesByType({ projectId });

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
        <ActivityLogs.ActorName activity={activity} />
        <span className="text-muted-foreground">changed</span>
        <span className="font-medium">{fieldLabel.toLowerCase()}</span>
        {prev && (
          <>
            <span className="text-muted-foreground">from</span>
            <StageBadge value={prev} stages={statuses} />
          </>
        )}
        {current && (
          <>
            <span className="text-muted-foreground">to</span>
            <StageBadge value={current} stages={statuses} />
          </>
        )}
      </div>
    </div>
  );
};

export const contractStatusActivityLog: ActivityLogCustomActivity = {
  type: 'contract.status_changed',
  render: (activity: TActivityLog) => <StatusActivityRow activity={activity} />,
};
