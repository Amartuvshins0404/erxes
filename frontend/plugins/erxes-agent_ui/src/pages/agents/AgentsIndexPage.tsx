import { useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApolloCache, useMutation, useQuery } from '@apollo/client';
import { ColumnDef, Row } from '@tanstack/react-table';
import {
  Icon,
  IconPlus,
  IconRobot,
  IconAlignLeft,
  IconBuilding,
  IconBuildingCommunity,
  IconCpu,
  IconTool,
  IconCalendar,
  IconLock,
  IconPencil,
  IconMessageCircle,
  IconEye,
  IconTrash,
  IconUsersGroup,
  IconWorld,
} from '@tabler/icons-react';
import {
  Button,
  CommandBar,
  Command,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Separator,
  toast,
} from 'erxes-ui';
import { MASTRA_AGENT_REMOVE, MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import {
  MASTRA_MY_AGENT_QUOTA_STATUS,
  AGENT_FORM_BRANCHES,
  AGENT_FORM_DEPARTMENTS,
  AGENT_FORM_UNITS,
} from '~/graphql/queries';
import {
  IconBadge,
  IdentityCell,
  RowActionsMenu,
  SortableHead,
  ToggleDeleteMenuItems,
  enabledStatusColumn,
} from '~/components/RecordTableShared';
import { GroupByConfig } from '~/components/GroupedRowList';
import { SortState, SortValue, useTableSort } from '~/components/useTableSort';
import { PermissionButton } from '~/components/PermissionButton';
import { ResourceIndexLayout } from '~/components/ResourceIndexLayout';
import { SplitBadge } from '~/components/SplitBadge';
import { buildActionColumns } from '~/components/buildActionColumns';
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

/** The agent's config: the detail Settings tab in console, the edit form in settings. */
const agentSettingsPath = (basePath: string, id: string) =>
  isConsoleShell(basePath) ? `${basePath}/${id}/settings` : `${basePath}/edit/${id}`;

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

// ─── More menu cell ───────────────────────────────────────────────────────────

const AgentMoreCell = ({ agent }: { agent: IAgent }) => {
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();
  const { confirmRemove } = useConfirmedRemove();
  const { canEditAgent, canRemoveAgent } = useAgentAccess();

  const canEdit = canEditAgent(agent);
  const canRemove = canRemoveAgent(agent);

  const [removeAgent] = useMutation(MASTRA_AGENT_REMOVE, {
    update: agentListCacheUpdate,
    onError: agentMutationError(),
  });

  const [updateAgent] = useMutation(MASTRA_AGENT_UPDATE, {
    update: agentListCacheUpdate,
    onError: agentMutationError(),
  });

  const handleDelete = () =>
    confirmRemove(
      { message: `Remove "${agent.name}"? This cannot be undone.` },
      () => removeAgent({ variables: { _id: agent._id } }),
    );

  const handleToggle = () => {
    updateAgent({
      variables: { _id: agent._id, doc: { isEnabled: !agent.isEnabled } },
    });
  };

  return (
    <RowActionsMenu>
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          onClick={() => navigate(`/erxes-agent/chat/${agent._id}`)}
        >
          <IconMessageCircle className="size-4" /> Chat
        </Button>
      </Command.Item>
      <Command.Item asChild>
        <PermissionButton
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          allowed={canEdit}
          onDenied={showAgentPermissionError}
          onClick={() => navigate(agentSettingsPath(basePath, agent._id))}
        >
          <IconPencil className="size-4" /> Edit
        </PermissionButton>
      </Command.Item>
      <ToggleDeleteMenuItems
        isEnabled={agent.isEnabled}
        onToggle={handleToggle}
        onDelete={handleDelete}
        toggleDisabled={!canEdit}
        deleteDisabled={!canRemove}
        onToggleDenied={showAgentPermissionError}
        onDeleteDenied={showAgentPermissionError}
      />
    </RowActionsMenu>
  );
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
    cell: ({ row }) => {
      const { _id, name, agentId, description } = row.original;
      return (
        <IdentityCell
          icon={IconRobot}
          tone="muted"
          name={
            <Link
              to={agentOpenPath(basePath, _id)}
              className="font-medium hover:underline cursor-pointer"
            >
              {name}
            </Link>
          }
          sub={
            <>
              <span className="font-mono">{agentId}</span>
              {description ? ` · ${description}` : ''}
            </>
          }
        />
      );
    },
    size: 260,
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

const buildColumns = (
  scopeNames: Record<string, string>,
  sort: SortState,
  onSort: (id: string) => void,
  basePath: string,
): ColumnDef<IAgent>[] =>
  buildActionColumns<IAgent>(
    (agent) => <AgentMoreCell agent={agent} />,
    buildBaseColumns(scopeNames, sort, onSort, basePath),
  );

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AgentsIndexPage = () => {
  const basePath = useAgentsBasePath();
  const { agentsList, loading, pageInfo, handleFetchMore } =
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

  return (
    <ResourceIndexLayout<IAgent>
      icon={IconRobot}
      title="Agents"
      rootPath={basePath}
      sessionKey="erxes_agent_agents"
      columns={columns}
      data={sorted}
      loading={loading}
      skeletonRows={20}
      pageInfo={pageInfo}
      onFetchMore={handleFetchMore}
      groupBy={VISIBILITY_GROUP}
      commandBar={<AgentBulkDeleteCommandBar />}
      headerExtra={
        <CreateAgentButton>
          <IconPlus /> New Agent
        </CreateAgentButton>
      }
      empty={{
        title: 'No agents yet',
        description: 'Create your first Mastra AI agent to get started.',
        action: (
          <CreateAgentButton>
            <IconPlus /> Create Agent
          </CreateAgentButton>
        ),
      }}
    />
  );
};
