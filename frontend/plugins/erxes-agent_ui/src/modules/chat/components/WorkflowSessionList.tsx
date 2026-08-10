import { memo } from 'react';
import { IconChevronLeft, IconSitemap } from '@tabler/icons-react';
import { Badge, Button, cn, Skeleton } from 'erxes-ui';
import type { IWorkflow } from '~/pages/workflows/types';
import { stepCount, triggerLabel } from '~/pages/workflows/shared';

const WorkflowItem = memo(
  ({
    workflow,
    active,
    onSelect,
  }: {
    workflow: IWorkflow;
    active: boolean;
    onSelect: (workflowId: string) => void;
  }) => (
    <Button
      variant="ghost"
      onClick={() => onSelect(workflow._id)}
      className={cn(
        'h-auto w-full justify-start rounded-md px-2.5 py-2 text-left',
        active && 'bg-accent',
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm">{workflow.name}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant={workflow.isEnabled ? 'success' : 'secondary'}>
            {workflow.isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
          <span>{triggerLabel(workflow.definition)}</span>
          <span>·</span>
          <span>{stepCount(workflow.definition)} steps</span>
        </div>
      </div>
    </Button>
  ),
);
WorkflowItem.displayName = 'WorkflowItem';

export const WorkflowSessionList = memo(
  ({
    workflows,
    loading,
    activeWorkflowId,
    onSelect,
    onBack,
    hasError,
    onRetry,
  }: {
    workflows: IWorkflow[];
    loading: boolean;
    activeWorkflowId?: string;
    onSelect: (workflowId: string) => void;
    onBack?: () => void;
    hasError?: boolean;
    onRetry?: () => void;
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
          Workflow
        </p>
      </div>
      <div className="ea-scroll flex-1 overflow-auto p-1.5 space-y-0.5">
        {loading ? (
          <div className="space-y-1.5 p-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : workflows.length === 0 && hasError ? (
          <div className="flex flex-col items-center gap-1.5 px-2.5 py-8 text-center text-muted-foreground">
            <IconSitemap className="size-5" />
            <p className="text-xs">Couldn't load workflows.</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                className="h-6"
                onClick={onRetry}
              >
                Retry
              </Button>
            )}
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-2.5 py-8 text-center text-muted-foreground">
            <IconSitemap className="size-5" />
            <p className="text-xs">No workflows for this agent.</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <WorkflowItem
              key={workflow._id}
              workflow={workflow}
              active={workflow._id === activeWorkflowId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  ),
);
WorkflowSessionList.displayName = 'WorkflowSessionList';
