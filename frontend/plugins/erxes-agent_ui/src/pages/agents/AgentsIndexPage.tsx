import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ApolloCache, useMutation, useQuery } from '@apollo/client';
import { ColumnDef, Row } from '@tanstack/react-table';
import {
  IconPlus,
  IconRobot,
  IconAlignLeft,
  IconCpu,
  IconTool,
  IconCalendar,
  IconPencil,
  IconMessageCircle,
  IconEye,
  IconTrash,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  CommandBar,
  Command,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Separator,
  useConfirm,
} from 'erxes-ui';
import { MASTRA_AGENT_REMOVE, MASTRA_AGENT_UPDATE } from '~/graphql/mutations';
import {
  MASTRA_MY_AGENT_QUOTA_STATUS,
  AGENT_FORM_BRANCHES,
  AGENT_FORM_DEPARTMENTS,
  AGENT_FORM_UNITS,
} from '~/graphql/queries';
import {
  RowActionsMenu,
  ToggleDeleteMenuItems,
  enabledStatusColumn,
} from '~/components/RecordTableShared';
import { PermissionButton } from '~/components/PermissionButton';
import { ResourceIndexLayout } from '~/components/ResourceIndexLayout';
import { SplitBadge } from '~/components/SplitBadge';
import { useMastraAgentList, IMastraAgentRow } from './useMastraAgentList';
import {
  agentMutationError,
  showAgentPermissionError,
  showAgentQuotaError,
  useAgentAccess,
} from './hooks/useAgentAccess';
import type { IMastraAgentQuotaStatus } from './types';

type IAgent = IMastraAgentRow;

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
      onClick={() => navigate('/settings/erxes-agent/agents/new')}
    >
      {children}
    </PermissionButton>
  );
};

// ─── More menu cell ───────────────────────────────────────────────────────────

const AgentMoreCell = ({ agent }: { agent: IAgent }) => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
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

  const handleDelete = () => {
    confirm({
      message: `Remove "${agent.name}"? This cannot be undone.`,
      options: { okLabel: 'Delete', cancelLabel: 'Cancel' },
    }).then(() => removeAgent({ variables: { _id: agent._id } }));
  };

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
          onClick={() =>
            navigate(`/settings/erxes-agent/agents/edit/${agent._id}`)
          }
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
  const { confirm } = useConfirm();
  const { canRemoveAgent } = useAgentAccess();

  const [removeAgent] = useMutation(MASTRA_AGENT_REMOVE, {
    update: agentListCacheUpdate,
    onError: agentMutationError(),
  });

  const removable = selectedRows.filter((r) => canRemoveAgent(r.original));

  const handleBulkDelete = () => {
    const count = removable.length;
    if (!count) return;
    confirm({
      message: `Delete ${count} agent${count !== 1 ? 's' : ''}? This cannot be undone.`,
      options: { okLabel: 'Delete', cancelLabel: 'Cancel' },
    }).then(() => {
      Promise.all(
        removable.map((row) =>
          removeAgent({ variables: { _id: row.original._id } }),
        ),
      ).then(() => table.resetRowSelection());
    });
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

// ─── Column builders ──────────────────────────────────────────────────────────

const buildBaseColumns = (
  scopeNames: Record<string, string>,
): ColumnDef<IAgent>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => <RecordTable.InlineHead icon={IconAlignLeft} label="Agent" />,
    cell: ({ row }) => {
      const { _id, name, agentId, description } = row.original;
      return (
        <RecordTableInlineCell>
          <Link
            to={`/settings/erxes-agent/agents/edit/${_id}`}
            className="font-medium hover:underline cursor-pointer"
          >
            {name}
          </Link>
          <div className="font-mono text-xs text-muted-foreground">
            {agentId}
          </div>
          {description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {description}
            </div>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 260,
  },
  {
    id: 'model',
    accessorKey: 'model',
    header: () => <RecordTable.InlineHead icon={IconCpu} label="Model" />,
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
            <Badge variant="secondary">
              {count > 0
                ? `${count} rule${count !== 1 ? 's' : ''}`
                : 'No tools'}
            </Badge>
          ) : (
            <Badge variant="success">All tools</Badge>
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
  enabledStatusColumn<IAgent>(),
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => (
      <RecordTable.InlineHead icon={IconCalendar} label="Created" />
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
): ColumnDef<IAgent>[] => [
  {
    id: 'more',
    cell: ({ row }) => <AgentMoreCell agent={row.original} />,
    size: 33,
  },
  RecordTable.checkboxColumn as ColumnDef<IAgent>,
  ...buildBaseColumns(scopeNames),
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AgentsIndexPage = () => {
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

  const columns = useMemo(() => buildColumns(scopeNames), [scopeNames]);

  return (
    <ResourceIndexLayout<IAgent>
      icon={IconRobot}
      title="Agents"
      rootPath="/settings/erxes-agent/agents"
      sessionKey="erxes_agent_agents"
      columns={columns}
      data={agentsList}
      loading={loading}
      skeletonRows={20}
      pageInfo={pageInfo}
      onFetchMore={handleFetchMore}
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
