import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import {
  IconAlignLeft,
  IconBook2,
  IconCalendar,
  IconCommand,
  IconPencil,
  IconPlus,
  IconRocket,
  IconSearch,
  IconStack2,
  IconTrash,
  IconWorldDown,
  IconWorldUp,
} from '@tabler/icons-react';
import {
  Badge,
  Breadcrumb,
  Button,
  Combobox,
  Command,
  Empty,
  Input,
  Popover,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  Separator,
  useConfirm,
} from 'erxes-ui';
import { PageHeader } from 'ui-modules';
import { PermissionButton } from '~/components/PermissionButton';
import { useSkillList } from '../hooks/useSkillList';
import { useSkillMutations } from '../hooks/useSkillMutations';
import {
  showSkillPermissionError,
  useSkillAccess,
} from '../hooks/useSkillAccess';
import { IMastraSkillRow, SkillScope, SkillStatus } from '../types';
import {
  skillStatusLabel,
  skillStatusVariant,
  skillVisibilityLabel,
} from '../utils';
import { SKILLS_PATH } from '../constants';

const SCOPE_FILTERS: { value: SkillScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'global', label: 'Global' },
];

const STATUS_FILTERS: { value: SkillStatus | ''; label: string }[] = [
  { value: '', label: 'Any status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const CreateSkillButton = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { canCreate } = useSkillAccess();
  return (
    <PermissionButton
      allowed={canCreate}
      onDenied={() => showSkillPermissionError('create')}
      onClick={() => navigate(`${SKILLS_PATH}/new`)}
    >
      {children}
    </PermissionButton>
  );
};

const SkillMoreCell = ({
  skill,
  refetch,
}: {
  skill: IMastraSkillRow;
  refetch: () => void;
}) => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { canEdit, canRemove, canPromote } = useSkillAccess();
  const { remove, publish, promote, demote } = useSkillMutations(refetch);

  // isMine is a nullable Boolean — only an explicit `true` is the owner.
  const isOwner = skill.isMine === true;
  const canPublish = skill.status === 'draft' && isOwner;
  const canPromoteRow =
    skill.status === 'published' &&
    skill.visibility === 'private' &&
    canPromote;
  // Demote is the escape hatch from a one-way promote: a global skill its
  // author (or an admin) can pull back to private. Mirrors the backend's
  // author-or-admin gate on mastraSkillDemote.
  const canDemoteRow =
    skill.visibility === 'public' && (isOwner || canPromote);

  const handleDelete = () =>
    confirm({
      message: `Delete "${skill.name}" and all its versions? This cannot be undone.`,
      options: { okLabel: 'Delete', cancelLabel: 'Cancel' },
    }).then(() => remove(skill._id));

  return (
    <Popover>
      <Popover.Trigger asChild>
        <RecordTable.MoreButton className="w-full h-full" />
      </Popover.Trigger>
      <Combobox.Content
        side="right"
        align="start"
        avoidCollisions={false}
        className="w-44 min-w-0 [&>button]:cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <Command.List>
            <Command.Item asChild>
              <PermissionButton
                variant="ghost"
                size="sm"
                className="justify-start w-full h-8"
                allowed={canEdit && isOwner}
                onDenied={() => showSkillPermissionError('edit')}
                onClick={() => navigate(`${SKILLS_PATH}/edit/${skill._id}`)}
              >
                <IconPencil className="size-4" /> Edit
              </PermissionButton>
            </Command.Item>
            {canPublish && (
              <Command.Item asChild>
                <PermissionButton
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full h-8"
                  allowed={canEdit}
                  onDenied={() => showSkillPermissionError('publish')}
                  onClick={() => publish(skill._id)}
                >
                  <IconRocket className="size-4" /> Publish
                </PermissionButton>
              </Command.Item>
            )}
            {canPromoteRow && (
              <Command.Item asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full h-8"
                  onClick={() => promote(skill._id)}
                >
                  <IconWorldUp className="size-4" /> Promote
                </Button>
              </Command.Item>
            )}
            {canDemoteRow && (
              <Command.Item asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full h-8"
                  onClick={() => demote(skill._id)}
                >
                  <IconWorldDown className="size-4" /> Demote
                </Button>
              </Command.Item>
            )}
            <Command.Item asChild>
              <PermissionButton
                variant="ghost"
                size="sm"
                className="justify-start w-full h-8 text-destructive"
                allowed={canRemove && isOwner}
                onDenied={() => showSkillPermissionError('delete')}
                onClick={handleDelete}
              >
                <IconTrash className="size-4" /> Delete
              </PermissionButton>
            </Command.Item>
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

const buildColumns = (refetch: () => void): ColumnDef<IMastraSkillRow>[] => [
  {
    id: 'more',
    cell: ({ row }) => <SkillMoreCell skill={row.original} refetch={refetch} />,
    size: 33,
  },
  RecordTable.checkboxColumn as ColumnDef<IMastraSkillRow>,
  {
    id: 'name',
    accessorKey: 'name',
    header: () => <RecordTable.InlineHead icon={IconAlignLeft} label="Skill" />,
    cell: ({ row }) => {
      const { _id, name, description } = row.original;
      return (
        <RecordTableInlineCell>
          <Link
            to={`${SKILLS_PATH}/edit/${_id}`}
            className="font-mono text-sm font-medium hover:underline cursor-pointer"
          >
            {name}
          </Link>
          {description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {description}
            </div>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 320,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => <RecordTable.InlineHead icon={IconStack2} label="Status" />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <Badge variant={skillStatusVariant(row.original.status)}>
          {skillStatusLabel(row.original.status)}
        </Badge>
      </RecordTableInlineCell>
    ),
    size: 110,
  },
  {
    id: 'visibility',
    accessorKey: 'visibility',
    header: () => <RecordTable.InlineHead icon={IconWorldUp} label="Scope" />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <Badge
          variant={
            row.original.visibility === 'public' ? 'default' : 'secondary'
          }
        >
          {skillVisibilityLabel(row.original.visibility)}
        </Badge>
      </RecordTableInlineCell>
    ),
    size: 100,
  },
  {
    id: 'userInvocable',
    accessorKey: 'userInvocable',
    header: () => <RecordTable.InlineHead icon={IconCommand} label="Slash" />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        {row.original.userInvocable ? (
          <Badge variant="secondary">/{row.original.name}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </RecordTableInlineCell>
    ),
    size: 150,
  },
  {
    id: 'versionCount',
    accessorKey: 'versionCount',
    header: () => <RecordTable.InlineHead icon={IconStack2} label="Versions" />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <span className="text-sm tabular-nums">
          {row.original.versionCount ?? 0}
        </span>
      </RecordTableInlineCell>
    ),
    size: 90,
  },
  {
    id: 'updatedAt',
    accessorKey: 'updatedAt',
    header: () => <RecordTable.InlineHead icon={IconCalendar} label="Updated" />,
    cell: ({ cell }) => {
      const value = cell.getValue() as string | undefined;
      return value ? (
        <RelativeDateDisplay value={value} asChild>
          <RecordTableInlineCell>
            <RelativeDateDisplay.Value value={value} />
          </RecordTableInlineCell>
        </RelativeDateDisplay>
      ) : (
        <RecordTableInlineCell>
          <span className="text-muted-foreground">—</span>
        </RecordTableInlineCell>
      );
    },
    size: 130,
  },
];

export const SkillsIndexPage = () => {
  const [scope, setScope] = useState<SkillScope>('all');
  const [status, setStatus] = useState<SkillStatus | ''>('');
  const [search, setSearch] = useState('');

  const { skillsList, totalCount, loading, pageInfo, handleFetchMore, refetch } =
    useSkillList({
      scope,
      status: status || undefined,
      searchValue: search,
    });

  const columns = useMemo(() => buildColumns(refetch), [refetch]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to={SKILLS_PATH}>
                    <IconBook2 />
                    Skills
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <CreateSkillButton>
            <IconPlus /> New skill
          </CreateSkillButton>
        </PageHeader.End>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
        <div className="flex items-center gap-1">
          {SCOPE_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={scope === f.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setScope(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Separator.Inline />
        <div className="flex items-center gap-1">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value || 'any'}
              variant={status === f.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setStatus(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative ml-auto">
          <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills…"
            className="h-8 w-56 pl-8"
          />
        </div>
        <Badge variant="secondary">
          {totalCount} {totalCount === 1 ? 'skill' : 'skills'}
        </Badge>
      </div>

      {!loading && skillsList.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Empty className="border border-dashed max-w-md w-full">
            <Empty.Header>
              <Empty.Media variant="icon">
                <IconBook2 />
              </Empty.Media>
              <Empty.Title>No skills yet</Empty.Title>
              <Empty.Description>
                Skills are reusable SKILL.md playbooks agents apply on demand.
                Create one, or distill a chat into a draft with “Make skill”.
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <CreateSkillButton>
                <IconPlus /> Create skill
              </CreateSkillButton>
            </Empty.Content>
          </Empty>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <RecordTable.Provider
            columns={columns}
            data={skillsList}
            className="m-3"
            stickyColumns={['more', 'checkbox', 'name']}
          >
            <RecordTable.CursorProvider
              hasPreviousPage={pageInfo.hasPreviousPage}
              hasNextPage={pageInfo.hasNextPage}
              loading={loading}
              dataLength={skillsList.length}
              sessionKey="erxes_agent_skills"
            >
              <RecordTable>
                <RecordTable.Header />
                <RecordTable.Body>
                  <RecordTable.CursorBackwardSkeleton
                    handleFetchMore={handleFetchMore}
                  />
                  {loading && skillsList.length === 0 ? (
                    <RecordTable.RowSkeleton rows={20} />
                  ) : (
                    <RecordTable.RowList />
                  )}
                  <RecordTable.CursorForwardSkeleton
                    handleFetchMore={handleFetchMore}
                  />
                </RecordTable.Body>
              </RecordTable>
            </RecordTable.CursorProvider>
          </RecordTable.Provider>
        </div>
      )}
    </div>
  );
};
