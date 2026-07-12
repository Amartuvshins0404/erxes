import { useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApolloCache, useMutation, useQuery } from '@apollo/client';
import { ColumnDef, Row } from '@tanstack/react-table';
import {
  Icon,
  IconPlus,
  IconRobot,
  IconAlignLeft,
  IconBook2,
  IconBuilding,
  IconBuildingCommunity,
  IconCpu,
  IconTool,
  IconCalendar,
  IconLock,
  IconEye,
  IconSitemap,
  IconStack2,
  IconTrash,
  IconUsersGroup,
  IconWorld,
} from '@tabler/icons-react';
import {
  Button,
  CommandBar,
  cn,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Separator,
  toast,
} from 'erxes-ui';
import { MASTRA_AGENT_REMOVE } from '~/graphql/mutations';
import {
  MASTRA_MY_AGENT_QUOTA_STATUS,
  AGENT_FORM_BRANCHES,
  AGENT_FORM_DEPARTMENTS,
  AGENT_FORM_UNITS,
} from '~/graphql/queries';
import {
  IconBadge,
  IdentityCell,
  SortableHead,
  enabledStatusColumn,
} from '~/components/RecordTableShared';
import { GroupByConfig } from '~/components/GroupedRowList';
import { SortState, SortValue, useTableSort } from '~/components/useTableSort';
import { PermissionButton } from '~/components/PermissionButton';
import { ResourceIndexLayout } from '~/components/ResourceIndexLayout';
import { SplitBadge } from '~/components/SplitBadge';
import { useConfirmedRemove } from '~/components/useConfirmedRemove';
import { useMastraAgentList, IMastraAgentRow } from './useMastraAgentList';
import {
  agentMutationError,
  showAgentPermissionError,
  showAgentQuotaError,
  useAgentAccess,
} from './hooks/useAgentAccess';
import { useAgentsBasePath } from './hooks/useAgentsBasePath';
import type { IMastraAgentQuotaStatus } from './types';

type IAgent = IMastraAgentRow;

// The per-agent detail workspace (tabs) is a console-shell feature. Under the
// Settings shell (`/settings/erxes-agent/agents`) there is no detail route, so
// agent rows there keep opening the plain edit form.
const isConsoleShell = (basePath: string) => !basePath.startsWith('/settings');

/** Where clicking an agent row goes: detail workspace in console, edit in settings. */
const agentOpenPath = (basePath: string, id: string) =>
  isConsoleShell(basePath) ? `${basePath}/${id}` : `${basePath}/edit/${id}`;

/** Deep-link to an agent workspace tab when the console shell provides one. */
const agentTabPath = (basePath: string, id: string, tab: string) =>
  isConsoleShell(basePath) ? `${basePath}/${id}/${tab}` : `${basePath}/edit/${id}`;

// Refresh the agent lists after a row mutation without prop-drilling a refetch
// through the table columns: invalidate every cached instance of both list
// fields (paginated table + dropdown/chat list). Shared by remove + toggle.
const agentListCacheUpdate = (cache: ApolloCache<unknown>) => {
  cache.evict({ fieldName: 'mastraAgentsMain' });
  cache.evict({ fieldName: 'mastraAgents' });
  cache.gc();
};

// ─── Create button (admin/owner only) ──────────────────────────────────────────

const CreateAgentButton = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();
  const { canCreate, isAdmin } = useAgentAccess();

  const { data: quotaData } = useQuery<{
    mastraMyAgentQuotaStatus: IMastraAgentQuotaStatus;
  }>(MASTRA_MY_AGENT_QUOTA_STATUS, { skip: !canCreate || isAdmin });

  const atQuota = !isAdmin && (quotaData?.mastraMyAgentQuotaStatus?.atQuota ?? false);
  const allowed = canCreate && !atQuota;

  return (
    <PermissionButton
      allowed={allowed}
      onDenied={atQuota ? showAgentQuotaError : showAgentPermissionError}
      onClick={() => navigate(`${basePath}/new`)}
    >
      {children}
    </PermissionButton>
  );
};

// Compact per-agent workflow/skill counts link to their workspace tabs.

const AgentResourcesCell = ({
  agent,
  basePath,
}: {
  agent: IAgent;
  basePath: string;
}) => {
  const chips = [
    { icon: IconSitemap, count: agent.workflowsCount ?? 0, tab: 'workflows', label: 'workflows' },
    { icon: IconBook2, count: agent.skills?.length ?? 0, tab: 'skills', label: 'skills' },
  ] as const;

  return (
    <RecordTableInlineCell>
      <div className="flex items-center gap-0.5">
        {chips.map(({ icon: ChipIcon, count, tab, label }) => (
          <Link
            key={tab}
            to={agentTabPath(basePath, agent._id, tab)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`${count} ${label}`}
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded px-1.5 text-xs transition-colors hover:bg-accent',
              count === 0 && 'text-muted-foreground/50',
            )}
          >
            <ChipIcon className="size-3.5 shrink-0" />
            <span className="tabular-nums">{count}</span>
          </Link>
        ))}
      </div>
    </RecordTableInlineCell>
  );
};

// Agent identity cell — name + id/description sub-line. The two nodes are
// memoized so a memoized IdentityCell isn't handed fresh JSX every render.
const AgentNameCell = ({ agent }: { agent: IAgent }) => {
  const name = useMemo(
    () => <span className="font-medium">{agent.name}</span>,
    [agent.name],
  );
  const sub = useMemo(
    () => (
      <>
        <span className="font-mono">{agent.agentId}</span>
        {agent.description ? ` · ${agent.description}` : ''}
      </>
    ),
    [agent.agentId, agent.description],
  );
  return <IdentityCell icon={IconRobot} tone="muted" name={name} sub={sub} />;
};

// ─── Bulk delete command bar ──────────────────────────────────────────────────

const AgentBulkDeleteCommandBar = () => {
  const { table } = RecordTable.useRecordTable();
  const selectedRows = table.getFilteredSelectedRowModel().rows as Row<IAgent>[];
  const { confirmRemove } = useConfirmedRemove();
  const { canRemoveAgent } = useAgentAccess();

  const [removeAgent] = useMutation(MASTRA_AGENT_REMOVE, {
    update: agentListCacheUpdate,
    onError: agentMutationError(),
  });

  const removable = selectedRows.filter((r) => canRemoveAgent(r.original));

  const handleBulkDelete = () => {
    const count = removable.length;
    if (!count) return;
    confirmRemove(
      {
        message: `Delete ${count} agent${count !== 1 ? 's' : ''}? This cannot be undone.`,
      },
      // allSettled so one rejected mutation never blocks the rest: the
      // selection resets regardless, deleted rows drop out, and a single
      // summary toast covers any failures (each also toasts via onError).
      async () => {
        const results = await Promise.allSettled(
          removable.map((row) =>
            removeAgent({ variables: { _id: row.original._id } }),
          ),
        );
        table.resetRowSelection();
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          toast({
            title: 'Some deletions failed',
            description: `${failed} of ${count} agent${count !== 1 ? 's' : ''} could not be removed.`,
            variant: 'destructive',
          });
        }
      },
    );
  };

  return (
    <CommandBar open={selectedRows.length > 0}>
      <CommandBar.Bar>
        <CommandBar.Value onClose={() => table.resetRowSelection()}>
          {selectedRows.length} selected
        </CommandBar.Value>
        <Separator.Inline />
        <Button
          variant="secondary"
          className="text-destructive"
          disabled={removable.length === 0}
          onClick={handleBulkDelete}
        >
          <IconTrash className="size-4" />
          Delete{removable.length < selectedRows.length ? ` (${removable.length})` : ''}
        </Button>
      </CommandBar.Bar>
    </CommandBar>
  );
};

// ─── Visibility meta + scope-name column ─────────────────────────────────────

const VISIBILITY_META = {
  org:        { label: 'Org-wide',   variant: 'success'   },
  team:       { label: 'Branch',     variant: 'secondary' },
  department: { label: 'Department', variant: 'secondary' },
  unit:       { label: 'Team',       variant: 'secondary' },
  private:    { label: 'Private',    variant: 'secondary' },
} as const;

const VISIBILITY_ICONS: Record<keyof typeof VISIBILITY_META, Icon> = {
  org: IconWorld,
  team: IconBuildingCommunity,
  department: IconBuilding,
  unit: IconUsersGroup,
  private: IconLock,
};

// Groups the list into collapsible sections by organization visibility, in
// broad→narrow order (Org-wide first, Private last). Reuses VISIBILITY_META so
// the section labels never drift from the visibility column's labels.
const VISIBILITY_GROUP: GroupByConfig<IAgent> = {
  getKey: (agent) => agent.visibility ?? 'private',
  sections: (
    Object.keys(VISIBILITY_META) as (keyof typeof VISIBILITY_META)[]
  ).map((key) => ({
    key,
    label: VISIBILITY_META[key].label,
    icon: VISIBILITY_ICONS[key],
    variant: VISIBILITY_META[key].variant,
  })),
};

// ─── Column builders ──────────────────────────────────────────────────────────

const buildBaseColumns = (
  scopeNames: Record<string, string>,
  sort: SortState,
  onSort: (id: string) => void,
  basePath: string,
): ColumnDef<IAgent>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => (
      <SortableHead
        icon={IconAlignLeft}
        label="Agent"
        columnId="name"
        sort={sort}
        onSort={onSort}
      />
    ),
    // Plain text: opening the agent is handled by the whole-row click
    // (see VISIBILITY_GROUP.onRowClick), not a per-name link.
    cell: ({ row }) => <AgentNameCell agent={row.original} />,
    size: 260,
  },
  {
    id: 'resources',
    header: () => (
      <RecordTable.InlineHead icon={IconStack2} label="Resources" />
    ),
    cell: ({ row }) => (
      <AgentResourcesCell agent={row.original} basePath={basePath} />
    ),
    size: 150,
  },
  {
    id: 'model',
    accessorKey: 'model',
    header: () => (
      <SortableHead
        icon={IconCpu}
        label="Model"
        columnId="model"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => {
      const { provider, model } = row.original;
      return (
        <RecordTableInlineCell>
          <div className="text-xs text-muted-foreground">{provider}</div>
          <div className="font-mono text-xs">{model}</div>
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'tools',
    accessorKey: 'toolPolicy',
    header: () => (
      <RecordTable.InlineHead icon={IconTool} label="Tool access" />
    ),
    cell: ({ row }) => {
      const { toolPolicy, allowedTools } = row.original;
      const isRestricted = toolPolicy === 'custom';
      const count = allowedTools?.length ?? 0;
      return (
        <RecordTableInlineCell>
          {isRestricted ? (
            <IconBadge icon={IconTool} variant="secondary">
              {count > 0
                ? `${count} rule${count !== 1 ? 's' : ''}`
                : 'No tools'}
            </IconBadge>
          ) : (
            <IconBadge icon={IconTool} variant="success">
              All tools
            </IconBadge>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 110,
  },
  {
    id: 'visibility',
    accessorKey: 'visibility',
    header: () => (
      <RecordTable.InlineHead icon={IconEye} label="Visibility" />
    ),
    cell: ({ row }) => {
      const { visibility, teamId, departmentId, unitId } = row.original;
      const { label, variant } = VISIBILITY_META[visibility ?? 'private'];
      const scopeId =
        visibility === 'team' ? teamId
        : visibility === 'department' ? departmentId
        : visibility === 'unit' ? unitId
        : undefined;
      const scopeName = scopeId ? scopeNames[scopeId] : undefined;
      return (
        <RecordTableInlineCell>
          <SplitBadge variant={variant} label={label} name={scopeName} />
        </RecordTableInlineCell>
      );
    },
    size: 160,
  },
  enabledStatusColumn<IAgent>({ sort, onSort }),
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => (
      <SortableHead
        icon={IconCalendar}
        label="Created"
        columnId="createdAt"
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

// Column order: the selection checkbox leads (it drives the bulk-delete command
// bar), then the data columns. No row-actions column — opening the row reaches
// everything (chat, settings, enable/disable, delete) in the agent workspace,
// and bulk delete lives on the selection command bar.
const buildColumns = (
  scopeNames: Record<string, string>,
  sort: SortState,
  onSort: (id: string) => void,
  basePath: string,
): ColumnDef<IAgent>[] => [
  RecordTable.checkboxColumn as ColumnDef<IAgent>,
  ...buildBaseColumns(scopeNames, sort, onSort, basePath),
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AgentsIndexPage = () => {
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();
  const { agentsList, loading, error, pageInfo, handleFetchMore, refetch } =
    useMastraAgentList();

  // Fetch scope labels for the visibility column (branches, depts, units).
  const { data: branchData } = useQuery<{ branches: { _id: string; title?: string | null }[] }>(
    AGENT_FORM_BRANCHES,
  );
  const { data: deptData } = useQuery<{ departments: { _id: string; title?: string | null }[] }>(
    AGENT_FORM_DEPARTMENTS,
  );
  const { data: unitData } = useQuery<{ units: { _id: string; title?: string | null }[] }>(
    AGENT_FORM_UNITS,
  );

  const scopeNames = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    branchData?.branches?.forEach((b) => { if (b.title) map[b._id] = b.title; });
    deptData?.departments?.forEach((d) => { if (d.title) map[d._id] = d.title; });
    unitData?.units?.forEach((u) => { if (u.title) map[u._id] = u.title; });
    return map;
  }, [branchData, deptData, unitData]);

  // Client-side sort over loaded rows. The agent list is offset-paginated, so
  // this orders what's currently loaded (more pages append on scroll).
  const getSortValue = useCallback(
    (a: IAgent, id: string): SortValue => {
      switch (id) {
        case 'name':
          return a.name;
        case 'model':
          return `${a.provider} ${a.model}`;
        case 'status':
          return a.isEnabled;
        case 'createdAt':
          return a.createdAt;
        default:
          return undefined;
      }
    },
    [],
  );

  const { sort, toggle, sorted } = useTableSort(agentsList, getSortValue);

  const columns = useMemo(
    () => buildColumns(scopeNames, sort, toggle, basePath),
    [scopeNames, sort, toggle, basePath],
  );

  // Whole-row click opens the agent workspace (console) / edit form (settings).
  // Built here (not at module scope) so it can navigate with the resolved base.
  const groupBy = useMemo<GroupByConfig<IAgent>>(
    () => ({
      ...VISIBILITY_GROUP,
      onRowClick: (agent) => navigate(agentOpenPath(basePath, agent._id)),
    }),
    [navigate, basePath],
  );

  const commandBar = useMemo(() => <AgentBulkDeleteCommandBar />, []);
  const headerExtra = useMemo(
    () => (
      <CreateAgentButton>
        <IconPlus /> New Agent
      </CreateAgentButton>
    ),
    [],
  );

  return (
    <ResourceIndexLayout<IAgent>
      icon={IconRobot}
      title="Agents"
      rootPath={basePath}
      sessionKey="erxes_agent_agents"
      stickyColumns={['checkbox', 'name']}
      columns={columns}
      data={sorted}
      loading={loading}
      skeletonRows={20}
      pageInfo={pageInfo}
      onFetchMore={handleFetchMore}
      groupBy={groupBy}
      commandBar={commandBar}
      headerExtra={headerExtra}
      empty={{
        title: 'No agents yet',
        description: 'Create your first Mastra AI agent to get started.',
        action: (
          <CreateAgentButton>
            <IconPlus /> Create Agent
          </CreateAgentButton>
        ),
      }}
      error={
        error
          ? {
              title: "Couldn't load agents",
              description: 'Something went wrong while fetching your agents.',
              onRetry: () => {
                void refetch().catch(() => undefined);
              },
            }
          : undefined
      }
    />
  );
};
