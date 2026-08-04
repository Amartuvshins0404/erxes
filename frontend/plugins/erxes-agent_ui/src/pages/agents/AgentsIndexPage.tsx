import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApolloCache, useMutation } from '@apollo/client';
import { ColumnDef, Row } from '@tanstack/react-table';
import {
  IconAlignLeft,
  IconCalendar,
  IconCpu,
  IconPlus,
  IconEye,
  IconRobot,
  IconShieldCheck,
  IconToggleRight,
  IconTrash,
} from '@tabler/icons-react';
import {
  Badge,
  Button,
  CommandBar,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Separator,
  toast,
} from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { MASTRA_AGENT_REMOVE } from '~/graphql/mutations';
import { IdentityCell, SortableHead } from '~/components/RecordTableShared';
import { SortState, SortValue, useTableSort } from '~/components/useTableSort';
import { PermissionButton } from '~/components/PermissionButton';
import { ResourceIndexLayout } from '~/components/ResourceIndexLayout';
import { useConfirmedRemove } from '~/components/useConfirmedRemove';
import { useMastraAgentList, IMastraAgentRow } from './useMastraAgentList';
import {
  agentMutationError,
  showAgentPermissionError,
  useAgentAccess,
} from './hooks/useAgentAccess';
import { useAgentsBasePath } from './hooks/useAgentsBasePath';
import { useAgentPermissionGroups } from './hooks/useAgentPermissionGroups';

type IAgent = IMastraAgentRow;
type Visibility = IAgent['visibility'];
type VisibilityLabels = Record<Visibility, string> & { title: string };

const isConsoleShell = (basePath: string) => !basePath.startsWith('/settings');
const agentOpenPath = (basePath: string, agent: IAgent, canEdit: boolean) =>
  !canEdit
    ? `/erxes-agent/chat/${agent._id}`
    : isConsoleShell(basePath)
    ? `${basePath}/${agent._id}`
    : `${basePath}/edit/${agent._id}`;

const agentListCacheUpdate = (cache: ApolloCache<unknown>) => {
  cache.evict({ fieldName: 'mastraAgentsMain' });
  cache.evict({ fieldName: 'mastraAgents' });
  cache.gc();
};

const CreateAgentButton = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const basePath = useAgentsBasePath();
  const { canCreate } = useAgentAccess();

  return (
    <PermissionButton
      allowed={canCreate}
      onDenied={showAgentPermissionError}
      onClick={() => navigate(`${basePath}/new`)}
    >
      {children}
    </PermissionButton>
  );
};

const AgentBulkDeleteCommandBar = () => {
  const { table } = RecordTable.useRecordTable();
  const selectedRows = table.getFilteredSelectedRowModel()
    .rows as Row<IAgent>[];
  const { confirmRemove } = useConfirmedRemove();
  const { canRemoveAgent } = useAgentAccess();
  const [removeAgent] = useMutation(MASTRA_AGENT_REMOVE, {
    update: agentListCacheUpdate,
    onError: agentMutationError(),
  });
  const removable = selectedRows.filter((row) => canRemoveAgent(row.original));

  const handleBulkDelete = () => {
    const count = removable.length;
    if (!count) return;
    confirmRemove(
      {
        message: `Remove ${count} AI team member${
          count === 1 ? '' : 's'
        }? Their erxes accounts will be deactivated.`,
      },
      async () => {
        const results = await Promise.allSettled(
          removable.map((row) =>
            removeAgent({ variables: { _id: row.original._id } }),
          ),
        );
        table.resetRowSelection();
        const failed = results.filter(
          (result) => result.status === 'rejected',
        ).length;
        if (failed) {
          toast({
            title: 'Some removals failed',
            description: `${failed} of ${count} AI team members could not be removed.`,
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
          disabled={!removable.length}
          onClick={handleBulkDelete}
        >
          <IconTrash className="size-4" />
          Remove
          {removable.length < selectedRows.length
            ? ` (${removable.length})`
            : ''}
        </Button>
      </CommandBar.Bar>
    </CommandBar>
  );
};

const buildColumns = (
  basePath: string,
  permissionGroupNames: Record<string, string>,
  visibilityLabels: VisibilityLabels,
  canEditAgent: (agent: IAgent) => boolean,
  sort: SortState,
  onSort: (id: string) => void,
): ColumnDef<IAgent>[] => [
  RecordTable.checkboxColumn as ColumnDef<IAgent>,
  {
    id: 'name',
    accessorKey: 'accountName',
    header: () => (
      <SortableHead
        icon={IconAlignLeft}
        label="Team member"
        columnId="name"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ row }) => (
      <IdentityCell
        icon={IconRobot}
        tone="primary"
        name={
          <Link
            className="font-medium hover:underline"
            to={agentOpenPath(
              basePath,
              row.original,
              canEditAgent(row.original),
            )}
          >
            {row.original.accountName}
          </Link>
        }
        sub={row.original.accountDescription || 'AI team member'}
      />
    ),
    size: 280,
  },
  {
    id: 'visibility',
    accessorKey: 'visibility',
    header: () => (
      <RecordTable.InlineHead icon={IconEye} label={visibilityLabels.title} />
    ),
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <Badge variant="secondary">
          {visibilityLabels[row.original.visibility]}
        </Badge>
      </RecordTableInlineCell>
    ),
    size: 140,
  },
  {
    id: 'permissions',
    header: () => (
      <RecordTable.InlineHead icon={IconShieldCheck} label="Permissions" />
    ),
    cell: ({ row }) => {
      const names = row.original.permissionGroupIds.map(
        (id) => permissionGroupNames[id] || id,
      );
      return (
        <RecordTableInlineCell>
          {names.length ? (
            <div className="flex min-w-0 items-center gap-1.5">
              <Badge variant="secondary" className="max-w-40 truncate">
                {names[0]}
              </Badge>
              {names.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  +{names.length - 1}
                </span>
              )}
            </div>
          ) : (
            <Badge variant="destructive">No permissions</Badge>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 210,
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
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <div className="text-xs text-muted-foreground">
          {row.original.provider}
        </div>
        <div className="font-mono text-xs">{row.original.model}</div>
      </RecordTableInlineCell>
    ),
    size: 200,
  },
  {
    id: 'status',
    accessorKey: 'isActive',
    header: () => (
      <SortableHead
        icon={IconToggleRight}
        label="Account status"
        columnId="status"
        sort={sort}
        onSort={onSort}
      />
    ),
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <Badge variant={cell.getValue() ? 'success' : 'secondary'}>
          {cell.getValue() ? 'Active' : 'Inactive'}
        </Badge>
      </RecordTableInlineCell>
    ),
    size: 130,
  },
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

export const AgentsIndexPage = () => {
  const { t } = useTranslation('mastra');
  const { t: tAgent } = useTranslation('erxes-agent');
  const { canEditAgent } = useAgentAccess();
  const basePath = useAgentsBasePath();
  const { agentsList, loading, error, pageInfo, handleFetchMore, refetch } =
    useMastraAgentList();
  const { groups: permissionGroups } = useAgentPermissionGroups();
  const permissionGroupNames = useMemo(
    () =>
      Object.fromEntries(
        permissionGroups.map((group) => [group.id, group.name]),
      ),
    [permissionGroups],
  );
  const visibilityLabels = useMemo<VisibilityLabels>(
    () => ({
      title: t('agent-settings-visibility-title'),
      private: t('agent-settings-private'),
      shared: tAgent('agent-settings-many'),
      organization: t('agent-settings-everyone'),
    }),
    [t, tAgent],
  );
  const getSortValue = useCallback((agent: IAgent, id: string): SortValue => {
    switch (id) {
      case 'name':
        return agent.accountName;
      case 'model':
        return `${agent.provider} ${agent.model}`;
      case 'status':
        return agent.isActive;
      case 'createdAt':
        return agent.createdAt;
      default:
        return undefined;
    }
  }, []);
  const { sort, toggle, sorted } = useTableSort(agentsList, getSortValue);
  const columns = useMemo(
    () =>
      buildColumns(
        basePath,
        permissionGroupNames,
        visibilityLabels,
        canEditAgent,
        sort,
        toggle,
      ),
    [
      basePath,
      canEditAgent,
      permissionGroupNames,
      visibilityLabels,
      sort,
      toggle,
    ],
  );
  const commandBar = useMemo(() => <AgentBulkDeleteCommandBar />, []);
  const headerExtra = useMemo(
    () => (
      <CreateAgentButton>
        <IconPlus /> Add AI Team Member
      </CreateAgentButton>
    ),
    [],
  );

  return (
    <ResourceIndexLayout<IAgent>
      icon={IconRobot}
      title="AI Team Members"
      rootPath={basePath}
      sessionKey="erxes_agent_team_members"
      stickyColumns={['checkbox', 'name']}
      columns={columns}
      data={sorted}
      loading={loading}
      skeletonRows={20}
      pageInfo={pageInfo}
      onFetchMore={handleFetchMore}
      commandBar={commandBar}
      headerExtra={headerExtra}
      empty={{
        title: 'No AI team members yet',
        description: 'Add an AI team member and assign its erxes permissions.',
        action: (
          <CreateAgentButton>
            <IconPlus /> Add AI Team Member
          </CreateAgentButton>
        ),
      }}
      error={
        error
          ? {
              title: "Couldn't load AI team members",
              description: 'Something went wrong while fetching team members.',
              onRetry: () => {
                void refetch().catch(() => undefined);
              },
            }
          : undefined
      }
    />
  );
};
