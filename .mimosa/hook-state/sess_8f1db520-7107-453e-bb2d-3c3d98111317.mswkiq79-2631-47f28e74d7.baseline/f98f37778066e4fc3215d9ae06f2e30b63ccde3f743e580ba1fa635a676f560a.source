import { Button } from 'erxes-ui';
import { IconExternalLink } from '@tabler/icons-react';
import {
  ActivityLogCustomActivity,
  ActivityLogs,
  TActivityLog,
} from 'ui-modules';

const CreatedFromOpptyRow = ({ activity }: { activity: TActivityLog }) => {
  const { metadata } = activity;
  const opptyId = metadata?.opptyId as string | undefined;
  const opptyNumber = metadata?.opptyNumber as string | undefined;
  const projectId = metadata?.projectId as string | undefined;

  const href =
    opptyId && projectId
      ? `/block/project/${projectId}/opportunities?activeOpptyId=${opptyId}`
      : undefined;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm text-foreground flex flex-row gap-1 flex-wrap items-center">
        <ActivityLogs.ActorName activity={activity} />
        <span className="text-muted-foreground">created this contract from opportunity</span>
        {href ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 font-medium text-primary"
            asChild
          >
            <a href={href} target="_blank" rel="noopener noreferrer">
              #{opptyNumber || opptyId}
              <IconExternalLink className="size-3 ml-1" />
            </a>
          </Button>
        ) : opptyNumber ? (
          <span className="font-medium">#{opptyNumber}</span>
        ) : null}
      </div>
    </div>
  );
};

export const contractCreatedFromOpptyActivityLog: ActivityLogCustomActivity = {
  type: 'contract.created_from_oppty',
  render: (activity: TActivityLog) => (
    <CreatedFromOpptyRow activity={activity} />
  ),
};
