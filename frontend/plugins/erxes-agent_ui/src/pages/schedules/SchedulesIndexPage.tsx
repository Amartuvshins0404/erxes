import { useCallback, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { ColumnDef } from '@tanstack/react-table';
import {
  IconPlus,
  IconAlignLeft,
  IconCalendarTime,
  IconClock,
  IconFileText,
  IconHistory,
  IconPencil,
  IconPlayerPlay,
  IconRobot,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  Command,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Tooltip,
  toast,
} from 'erxes-ui';
import {
  MASTRA_SCHEDULE_REMOVE,
  MASTRA_SCHEDULE_RUN_NOW,
  MASTRA_SCHEDULE_SET_ENABLED,
} from '~/graphql/mutations';
import { toastError } from '~/lib/mutationToast';
import {
  IconBadge,
  IdentityCell,
  RowActionsMenu,
  SortableHead,
  ToggleDeleteMenuItems,
  enabledStatusColumn,
} from '~/components/RecordTableShared';
import { ResourceIndexLayout } from '~/components/ResourceIndexLayout';
import { SortState, SortValue, useTableSort } from '~/components/useTableSort';
import { buildActionColumns } from '~/components/buildActionColumns';
import { useConfirmedRemove } from '~/components/useConfirmedRemove';
import { useSchedules } from './hooks/useSchedules';
import { ScheduleOutputSheet } from './components/ScheduleOutputSheet';
import {
  ISchedule,
  IScheduleRunNowResponse,
  SCHEDULE_STATUS_VARIANTS,
} from './types';

// ─── More menu cell ───────────────────────────────────────────────────────────

/** Row actions: run now, view last-run output, edit, enable/disable, delete. */
const ScheduleMoreCell = ({
  schedule,
  refetch,
  onViewOutput,
}: {
  schedule: ISchedule;
  refetch: () => void;
  onViewOutput: (id: string) => void;
}) => {
  const navigate = useNavigate();
  const { confirmRemove } = useConfirmedRemove();

  const [removeSchedule] = useMutation(MASTRA_SCHEDULE_REMOVE, {
    onCompleted: () => refetch(),
    onError: toastError(),
  });

  const [setEnabled] = useMutation(MASTRA_SCHEDULE_SET_ENABLED, {
    onCompleted: () => refetch(),
    onError: toastError(),
  });

  const [runNow, { loading: running }] = useMutation<IScheduleRunNowResponse>(
    MASTRA_SCHEDULE_RUN_NOW,
    {
      onCompleted: (data) => {
        const outcome = data?.mastraScheduleRunNow;
        if (outcome?.lastStatus === 'failed') {
          toast({
            title: 'Run failed',
            description: outcome.lastError || schedule.name,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Run finished', description: schedule.name });
        }
        refetch();
      },
      onError: toastError(),
    },
  );

  /** Confirm, then remove the schedule together with its output thread. */
  const handleDelete = () =>
    confirmRemove(
      {
        message: `Remove "${schedule.name}" and its output thread? This cannot be undone.`,
      },
      () => removeSchedule({ variables: { _id: schedule._id } }),
    );

  return (
    <RowActionsMenu>
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          disabled={running}
          onClick={() => {
            toast({ title: 'Running…', description: schedule.name });
            runNow({ variables: { _id: schedule._id } });
          }}
        >
          <IconPlayerPlay className="size-4" /> Run now
        </Button>
      </Command.Item>
      <Command.Item asChild>
        {/*
          Output is shown in an in-place panel, NOT the chat view: a schedule's
          run thread is ownership-scoped to the background principal (the agent's
          owner / service user), so the human-scoped thread query returns
          "Thread not found" and chat renders an empty composer. See
          ScheduleOutputSheet for the full rationale.
        */}
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          disabled={!schedule.lastRunAt}
          title={
            schedule.lastRunAt ? undefined : 'No output yet — this hasn’t run'
          }
          onClick={() => onViewOutput(schedule._id)}
        >
          <IconFileText className="size-4" /> View output
        </Button>
      </Command.Item>
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          onClick={() =>
            navigate(`/erxes-agent/schedules/edit/${schedule._id}`)
          }
        >
          <IconPencil className="size-4" /> Edit
        </Button>
      </Command.Item>
      <ToggleDeleteMenuItems
        isEnabled={schedule.isEnabled}
        onToggle={() =>
          setEnabled({
            variables: {
              _id: schedule._id,
              isEnabled: !schedule.isEnabled,
            },
          })
        }
        onDelete={handleDelete}
      />
    </RowActionsMenu>
  );
};

// ─── Columns ──────────────────────────────────────────────────────────────────

/** Status badge (with error tooltip on failure) plus relative run time. */
const LastRunCell = ({ schedule }: { schedule: ISchedule }) => {
  if (!schedule.lastRunAt) {
    return (
      <RecordTableInlineCell>
        <span className="text-xs text-muted-foreground">Never</span>
      </RecordTableInlineCell>
    );
  }
  const failed = schedule.lastStatus === 'failed';
  const badge = (
    <Badge variant={SCHEDULE_STATUS_VARIANTS[schedule.lastStatus ?? 'success']}>
      {schedule.lastStatus}
    </Badge>
  );
  return (
    <RecordTableInlineCell>
      <div className="flex items-center gap-2">
        {failed && schedule.lastError ? (
          <Tooltip.Provider>
            <Tooltip>
              <Tooltip.Trigger asChild>{badge}</Tooltip.Trigger>
              <Tooltip.Content className="max-w-sm break-words">
                {schedule.lastError}
              </Tooltip.Content>
            </Tooltip>
          </Tooltip.Provider>
        ) : (
          badge
        )}
        <RelativeDateDisplay value={schedule.lastRunAt} asChild>
          <span className="text-xs text-muted-foreground">
            <RelativeDateDisplay.Value value={schedule.lastRunAt} />
          </span>
        </RelativeDateDisplay>
      </div>
    </RecordTableInlineCell>
  );
};

const buildBaseColumns = (
  sort: SortState,
  onSort: (id: string) => void,
  onViewOutput: (id: string) => void,
): ColumnDef<ISchedule>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <SortableHead
        icon={IconAlignLeft}
        label="Schedule"
        columnId="name"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => {
      const { _id, name, description } = row.original;
      return (
        <IdentityCell
          icon={IconClock}
          tone="info"
          name={
            <Link
              to={`/erxes-agent/schedules/edit/${_id}`}
              className="font-medium hover:underline cursor-pointer"
            >
              {name}
            </Link>
          }
          sub={description}
        />
      );
    },
    size: 260,
  },
  {
    id: 'agent',
    accessorKey: 'agentId',
    header: () => (
      <SortableHead
        icon={IconRobot}
        label="Agent"
        columnId="agent"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <IconBadge icon={IconRobot} variant="secondary" className="font-mono">
          {row.original.agentId}
        </IconBadge>
      </RecordTableInlineCell>
    ),
    size: 160,
  },
  {
    id: 'cron',
    accessorKey: 'cron',
    header: () => (
      <SortableHead
        icon={IconClock}
        label="Cron"
        columnId="cron"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <span className="font-mono text-xs">{row.original.cron}</span>
        {row.original.timezone && row.original.timezone !== 'UTC' && (
          <span className="text-[10px] text-muted-foreground ml-1.5">
            {row.original.timezone}
          </span>
        )}
      </RecordTableInlineCell>
    ),
    size: 150,
  },
  enabledStatusColumn<ISchedule>({ sort, onSort }),
  {
    id: 'lastRun',
    header: () => (
      <SortableHead
        icon={IconHistory}
        label="Last run"
        columnId="lastRun"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => <LastRunCell schedule={row.original} />,
    size: 180,
  },
  {
    id: 'runCount',
    accessorKey: 'runCount',
    header: () => (
      <SortableHead
        icon={IconPlayerPlay}
        label="Runs"
        columnId="runCount"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => {
      const count = row.original.runCount || 0;
      return (
        <RecordTableInlineCell>
          {count > 0 ? (
            <button
              type="button"
              className="text-sm tabular-nums hover:underline cursor-pointer"
              title="View last-run output"
              onClick={() => onViewOutput(row.original._id)}
            >
              {count}
            </button>
          ) : (
            <span className="text-sm tabular-nums text-muted-foreground">
              0
            </span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 70,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

/** The full column set, with the actions column bound to this list's refetch. */
const buildColumns = (
  refetch: () => void,
  sort: SortState,
  onSort: (id: string) => void,
  onViewOutput: (id: string) => void,
): ColumnDef<ISchedule>[] =>
  buildActionColumns<ISchedule>(
    (schedule) => (
      <ScheduleMoreCell
        schedule={schedule}
        refetch={refetch}
        onViewOutput={onViewOutput}
      />
    ),
    buildBaseColumns(sort, onSort, onViewOutput),
  );

/**
 * Record table of agent schedules with row actions. When `agentId` is passed
 * (the per-agent Schedules tab) the list is scoped and "New schedule" prefills
 * the owning agent.
 */
export const SchedulesIndexPage = ({
  agentId,
  embedded,
}: {
  agentId?: string;
  embedded?: boolean;
} = {}) => {
  const { schedules, loading, refetch } = useSchedules(agentId);

  // Selected by _id (not the object) so the open panel reflects fresh data after
  // a "Run now" refetch, which replaces the schedule object in the list.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => schedules.find((s) => s._id === selectedId) ?? null,
    [schedules, selectedId],
  );

  const newPath = agentId
    ? `/erxes-agent/schedules/new?agentId=${encodeURIComponent(agentId)}`
    : '/erxes-agent/schedules/new';

  const getSortValue = useCallback((s: ISchedule, id: string): SortValue => {
    switch (id) {
      case 'name':
        return s.name;
      case 'agent':
        return s.agentId;
      case 'cron':
        return s.cron;
      case 'status':
        return s.isEnabled;
      case 'lastRun':
        return s.lastRunAt;
      case 'runCount':
        return s.runCount;
      default:
        return undefined;
    }
  }, []);

  const { sort, toggle, sorted } = useTableSort(schedules, getSortValue);

  const columns = useMemo(
    () => buildColumns(refetch, sort, toggle, setSelectedId),
    [refetch, sort, toggle],
  );

  return (
    <>
      <ResourceIndexLayout<ISchedule>
        icon={IconCalendarTime}
        title="Schedules"
        rootPath="/erxes-agent/schedules"
        sessionKey="erxes_agent_schedules"
        columns={columns}
        data={sorted}
        loading={loading}
        embedded={embedded}
        newButton={{ to: newPath, label: 'New Schedule' }}
        empty={{
          title: 'No schedules yet',
          description:
            'Run an agent on a recurring cron — daily reports, periodic checks, reminders.',
          action: (
            <Button asChild>
              <Link to={newPath}>
                <IconPlus /> Create Schedule
              </Link>
            </Button>
          ),
        }}
      />
      <ScheduleOutputSheet
        schedule={selected}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
};
