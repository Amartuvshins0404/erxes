import { useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  Icon,
  IconPlus,
  IconSitemap,
  IconAlignLeft,
  IconBolt,
  IconCalendar,
  IconClock,
  IconHandClick,
  IconListNumbers,
  IconPencil,
  IconPlayerPlay,
  IconEye,
  IconVersions,
} from '@tabler/icons-react';
import {
  Button,
  Command,
  RecordTableInlineCell,
  RelativeDateDisplay,
  toast,
} from 'erxes-ui';
import {
  IconBadge,
  IdentityCell,
  RowActionsMenu,
  SortableHead,
  ToggleDeleteMenuItems,
  Tone,
  enabledStatusColumn,
} from '~/components/RecordTableShared';
import { ResourceIndexLayout } from '~/components/ResourceIndexLayout';
import { SortState, SortValue, useTableSort } from '~/components/useTableSort';
import { buildActionColumns } from '~/components/buildActionColumns';
import { useConfirmedRemove } from '~/components/useConfirmedRemove';
import { stepCount, triggerLabel } from './shared';
import { useWorkflows } from './hooks/useWorkflows';
import { useWorkflowActions } from './hooks/useWorkflowMutations';
import { IWorkflow, IWorkflowDefinition } from './types';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

// ─── Trigger identity ───────────────────────────────────────────────────────────

// Each trigger kind gets a glyph + tone (for the identity tile) and a badge
// variant, so the list reads by trigger type at a glance.
const TRIGGER_META: Record<
  string,
  { icon: Icon; tone: Tone; variant: BadgeVariant }
> = {
  manual: { icon: IconHandClick, tone: 'muted', variant: 'secondary' },
  automation: { icon: IconBolt, tone: 'info', variant: 'info' },
  schedule: { icon: IconClock, tone: 'warning', variant: 'warning' },
};

const triggerMeta = (definition?: IWorkflowDefinition) => {
  const type = (definition?.trigger?.type || 'manual').toLowerCase();
  return (
    TRIGGER_META[type] ?? {
      icon: IconBolt,
      tone: 'primary' as Tone,
      variant: 'default' as BadgeVariant,
    }
  );
};

// ─── More menu cell ───────────────────────────────────────────────────────────

const WorkflowMoreCell = ({
  workflow,
  refetch,
}: {
  workflow: IWorkflow;
  refetch: () => void;
}) => {
  const navigate = useNavigate();
  const { confirmRemove } = useConfirmedRemove();
  const { removeWorkflow, setEnabled, runStart } = useWorkflowActions(
    refetch,
    () => {
      toast({ title: 'Run started', description: workflow.name });
      navigate(`/erxes-agent/workflows/${workflow._id}`);
    },
  );

  const handleRun = () =>
    runStart({ variables: { _id: workflow._id, input: {} } });

  const handleDelete = () =>
    confirmRemove(
      {
        message: `Remove "${workflow.name}" and all its run history? This cannot be undone.`,
      },
      () => removeWorkflow({ variables: { _id: workflow._id } }),
    );

  return (
    <RowActionsMenu>
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          onClick={() => navigate(`/erxes-agent/workflows/${workflow._id}`)}
        >
          <IconEye className="size-4" /> View runs
        </Button>
      </Command.Item>
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          onClick={handleRun}
        >
          <IconPlayerPlay className="size-4" /> Run now
        </Button>
      </Command.Item>
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          onClick={() =>
            navigate(`/erxes-agent/workflows/edit/${workflow._id}`)
          }
        >
          <IconPencil className="size-4" /> Edit
        </Button>
      </Command.Item>
      <ToggleDeleteMenuItems
        isEnabled={workflow.isEnabled}
        onToggle={() =>
          setEnabled({
            variables: {
              _id: workflow._id,
              isEnabled: !workflow.isEnabled,
            },
          })
        }
        onDelete={handleDelete}
      />
    </RowActionsMenu>
  );
};

// ─── Columns ──────────────────────────────────────────────────────────────────

const WorkflowNameLink = ({ _id, name }: { _id: string; name: string }) => (
  <Link
    to={`/erxes-agent/workflows/${_id}`}
    className="font-medium hover:underline cursor-pointer"
  >
    {name}
  </Link>
);

const WorkflowNameCell = ({ workflow }: { workflow: IWorkflow }) => {
  const { _id, name, description, definition } = workflow;
  const meta = triggerMeta(definition);
  const nameNode = useMemo(
    () => <WorkflowNameLink _id={_id} name={name} />,
    [_id, name],
  );
  return (
    <IdentityCell
      icon={meta.icon}
      tone={meta.tone}
      name={nameNode}
      sub={description}
    />
  );
};

const buildBaseColumns = (
  sort: SortState,
  onSort: (id: string) => void,
): ColumnDef<IWorkflow>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <SortableHead
        icon={IconAlignLeft}
        label="Workflow"
        columnId="name"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <WorkflowNameCell workflow={row.original} />,
    size: 280,
  },
  {
    id: 'trigger',
    header: () => (
      <SortableHead
        icon={IconBolt}
        label="Trigger"
        columnId="trigger"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => {
      const meta = triggerMeta(row.original.definition);
      return (
        <RecordTableInlineCell>
          <IconBadge icon={meta.icon} variant={meta.variant}>
            {triggerLabel(row.original.definition)}
          </IconBadge>
        </RecordTableInlineCell>
      );
    },
    size: 160,
  },
  {
    id: 'steps',
    header: () => (
      <SortableHead
        icon={IconListNumbers}
        label="Steps"
        columnId="steps"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <span className="flex items-center gap-1 text-sm tabular-nums">
          <IconListNumbers className="size-3.5 text-muted-foreground" />
          {stepCount(row.original.definition)}
        </span>
      </RecordTableInlineCell>
    ),
    size: 80,
  },
  {
    id: 'version',
    accessorKey: 'version',
    header: () => (
      <SortableHead
        icon={IconVersions}
        label="Version"
        columnId="version"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <span className="font-mono text-xs text-muted-foreground">
          v{cell.getValue() as number}
        </span>
      </RecordTableInlineCell>
    ),
    size: 80,
  },
  enabledStatusColumn<IWorkflow>({ sort, onSort }),
  {
    id: 'updatedAt',
    accessorKey: 'updatedAt',
    header: () => (
      <SortableHead
        icon={IconCalendar}
        label="Updated"
        columnId="updatedAt"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ cell }) => (
      <RelativeDateDisplay value={cell.getValue() as string} asChild>
        <RecordTableInlineCell>
          <RelativeDateDisplay.Value value={cell.getValue() as string} />
        </RecordTableInlineCell>
      </RelativeDateDisplay>
    ),
    size: 130,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Standalone workflows index, and — when `agentId` is passed — the per-agent
 * Workflows tab. In agent context the list is scoped and "New workflow" carries
 * the agentId so the create form can attach the now-required owning agent.
 */
export const WorkflowsIndexPage = ({
  agentId,
  embedded,
}: {
  agentId?: string;
  embedded?: boolean;
} = {}) => {
  const { workflows, loading, refetch } = useWorkflows(agentId);

  const newPath = agentId
    ? `/erxes-agent/workflows/new?agentId=${encodeURIComponent(agentId)}`
    : '/erxes-agent/workflows/new';

  const getSortValue = useCallback(
    (w: IWorkflow, id: string): SortValue => {
      switch (id) {
        case 'name':
          return w.name;
        case 'trigger':
          return triggerLabel(w.definition);
        case 'steps':
          return stepCount(w.definition);
        case 'version':
          return w.version;
        case 'status':
          return w.isEnabled;
        case 'updatedAt':
          return w.updatedAt;
        default:
          return undefined;
      }
    },
    [],
  );

  const { sort, toggle, sorted } = useTableSort(workflows, getSortValue);

  const columns = useMemo<ColumnDef<IWorkflow>[]>(
    () =>
      buildActionColumns<IWorkflow>(
        (workflow) => (
          <WorkflowMoreCell workflow={workflow} refetch={refetch} />
        ),
        buildBaseColumns(sort, toggle),
      ),
    [refetch, sort, toggle],
  );

  return (
    <ResourceIndexLayout<IWorkflow>
      icon={IconSitemap}
      title="Workflows"
      rootPath="/erxes-agent/workflows"
      sessionKey="erxes_agent_workflows"
      columns={columns}
      data={sorted}
      loading={loading}
      embedded={embedded}
      newButton={{ to: newPath, label: 'New Workflow' }}
      empty={{
        title: 'No workflows yet',
        description: 'Ask an agent to build one in Chat, or create one by hand.',
        action: (
          <Button asChild>
            <Link to={newPath}>
              <IconPlus /> Create Workflow
            </Link>
          </Button>
        ),
      }}
    />
  );
};
