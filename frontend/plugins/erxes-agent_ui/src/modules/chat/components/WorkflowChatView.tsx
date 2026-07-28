import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@apollo/client';
import {
  IconCircleCheck,
  IconExternalLink,
  IconPlayerPlay,
  IconSitemap,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Skeleton, toast } from 'erxes-ui';
import {
  MASTRA_WORKFLOW_APPROVE,
  MASTRA_WORKFLOW_RUN_START,
} from '~/graphql/mutations';
import { WorkflowGraph } from '~/pages/workflows/graph/WorkflowGraph';
import { useWorkflowRuns } from '~/pages/workflows/hooks/useWorkflowRuns';
import {
  formatDuration,
  formatTimestamp,
  RunStatusBadge,
  stepCount,
  triggerLabel,
} from '~/pages/workflows/shared';
import type { IWorkflow } from '~/pages/workflows/types';

export const WorkflowChatView = ({
  workflow,
  onWorkflowChanged,
}: {
  workflow: IWorkflow | null;
  onWorkflowChanged: () => void;
}) => {
  const { t } = useTranslation('mastra');
  const canReadRuns = workflow?.capabilities.canReadRuns === true;
  const canRun =
    workflow?.approvalStatus === 'approved' &&
    workflow.capabilities.canRun === true;
  const canApprove =
    workflow?.approvalStatus === 'draft' &&
    workflow.capabilities.canApprove === true;
  const { runs, loading, refetch, startPolling, stopPolling } = useWorkflowRuns(
    workflow?._id,
    10,
    !canReadRuns,
  );
  const hasActiveRun = runs.some(({ status }) => status === 'running');

  useEffect(() => {
    if (canReadRuns && hasActiveRun) startPolling(3000);
    else stopPolling();
    return () => stopPolling();
  }, [canReadRuns, hasActiveRun, startPolling, stopPolling]);

  const [runWorkflow, { loading: running }] = useMutation(
    MASTRA_WORKFLOW_RUN_START,
    {
      onCompleted: () => {
        toast({ title: 'Workflow started' });
        if (canReadRuns) void refetch();
      },
      onError: (error) =>
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        }),
    },
  );

  const [approveWorkflow, { loading: approving }] = useMutation(
    MASTRA_WORKFLOW_APPROVE,
    {
      onCompleted: onWorkflowChanged,
      onError: (error) =>
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        }),
    },
  );

  if (!workflow) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <IconSitemap className="size-8" />
        <p className="text-sm">Select a workflow.</p>
      </div>
    );
  }

  return (
    <div className="ea-scroll h-full overflow-auto p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <Card className="shadow-none">
          <Card.Header>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Card.Title>{workflow.name}</Card.Title>
                {workflow.description && (
                  <Card.Description>{workflow.description}</Card.Description>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link to={`/erxes-agent/workflows/${workflow._id}`}>
                    <IconExternalLink /> Open
                  </Link>
                </Button>
                {canApprove && (
                  <Button
                    variant="outline"
                    disabled={approving}
                    onClick={() =>
                      approveWorkflow({ variables: { _id: workflow._id } })
                    }
                  >
                    <IconCircleCheck /> {t('workflow-approve')}
                  </Button>
                )}
                {canRun && (
                  <Button
                    onClick={() =>
                      runWorkflow({
                        variables: { _id: workflow._id, input: {} },
                      })
                    }
                    disabled={running}
                  >
                    <IconPlayerPlay /> {running ? 'Starting…' : 'Run now'}
                  </Button>
                )}
              </div>
            </div>
          </Card.Header>
          <Card.Content className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={workflow.isEnabled ? 'success' : 'secondary'}>
                {workflow.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Badge variant="secondary">
                {triggerLabel(workflow.definition)}
              </Badge>
              <Badge variant="secondary">
                {stepCount(workflow.definition)} steps
              </Badge>
              <Badge variant="secondary">v{workflow.version}</Badge>
              <Badge
                variant={
                  workflow.approvalStatus === 'approved' ? 'success' : 'warning'
                }
              >
                {t(`workflow-approval-${workflow.approvalStatus}`)}
              </Badge>
            </div>
            <div className="h-[360px] overflow-hidden rounded-md border">
              <WorkflowGraph definition={workflow.definition} />
            </div>
          </Card.Content>
        </Card>

        {canReadRuns && (
          <Card className="shadow-none">
            <Card.Header>
              <Card.Title className="text-base">Recent runs</Card.Title>
            </Card.Header>
            <Card.Content>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-full" />
                  ))}
                </div>
              ) : runs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  This workflow has not run yet.
                </p>
              ) : (
                <div className="divide-y">
                  {runs.map((run) => (
                    <div
                      key={run._id}
                      className="flex items-center gap-3 py-2 text-sm"
                    >
                      <RunStatusBadge status={run.status} />
                      <span className="text-xs text-muted-foreground">
                        {run.triggerEnvelope?.source || 'manual'}
                      </span>
                      <span className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(run.startedAt, run.finishedAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(run.startedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
};
