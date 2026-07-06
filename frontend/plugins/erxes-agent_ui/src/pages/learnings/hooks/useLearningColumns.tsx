import { useMemo } from 'react';
import { useMutation } from '@apollo/client';
import { ColumnDef } from '@tanstack/react-table';
import {
  IconActivity,
  IconArchive,
  IconBulb,
  IconCalendar,
  IconCategory,
  IconChartBar,
  IconCircleCheck,
  IconCircleX,
  IconPin,
  IconPinFilled,
  IconTrash,
  IconUsers,
} from '@tabler/icons-react';
import {
  Button,
  Command,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import {
  MASTRA_LEARNING_PIN,
  MASTRA_LEARNING_SET_STATUS,
  MASTRA_LEARNING_REMOVE,
} from '~/graphql/mutations';
import { toastError } from '~/lib/mutationToast';
import {
  IconBadge,
  RowActionsMenu,
  SortableHead,
} from '~/components/RecordTableShared';
import { SortState } from '~/components/useTableSort';
import { useConfirmedRemove } from '~/components/useConfirmedRemove';
import { ILearningRow, confidencePct, statusVariant } from '../types';
import { LearningStatementCell } from './LearningStatementCell';

const LearningMoreCell = ({
  learning,
  refetch,
}: {
  learning: ILearningRow;
  refetch: () => void;
}) => {
  const { confirmRemove } = useConfirmedRemove();

  const [pin] = useMutation(MASTRA_LEARNING_PIN, {
    onCompleted: () => refetch(),
    onError: toastError(),
  });
  const [setStatus] = useMutation(MASTRA_LEARNING_SET_STATUS, {
    onCompleted: () => refetch(),
    onError: toastError(),
  });
  const [remove] = useMutation(MASTRA_LEARNING_REMOVE, {
    onCompleted: () => refetch(),
    onError: toastError(),
  });

  const handleDelete = () =>
    confirmRemove(
      { message: 'Remove this learning permanently? This cannot be undone.' },
      () => remove({ variables: { _id: learning._id } }),
    );

  const statusItem = (
    next: string,
    label: string,
    Icon: typeof IconCircleCheck,
  ) =>
    learning.status === next ? null : (
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          onClick={() =>
            setStatus({ variables: { _id: learning._id, status: next } })
          }
        >
          <Icon className="size-4" /> {label}
        </Button>
      </Command.Item>
    );

  return (
    <RowActionsMenu>
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8"
          onClick={() =>
            pin({
              variables: { _id: learning._id, pinned: !learning.pinned },
            })
          }
        >
          {learning.pinned ? (
            <>
              <IconPin className="size-4" /> Unpin
            </>
          ) : (
            <>
              <IconPinFilled className="size-4" /> Pin
            </>
          )}
        </Button>
      </Command.Item>
      {statusItem('approved', 'Approve', IconCircleCheck)}
      {statusItem('rejected', 'Reject', IconCircleX)}
      {statusItem('archived', 'Archive', IconArchive)}
      <Command.Item asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start w-full h-8 text-destructive"
          onClick={handleDelete}
        >
          <IconTrash className="size-4" /> Delete
        </Button>
      </Command.Item>
    </RowActionsMenu>
  );
};

export const useLearningColumns = ({
  setSelected,
  refetch,
  sort,
  onSort,
}: {
  setSelected: (item: ILearningRow) => void;
  refetch: () => void;
  sort: SortState;
  onSort: (id: string) => void;
}) =>
  useMemo<ColumnDef<ILearningRow>[]>(
    () => [
      {
        id: 'more',
        cell: ({ row }) => (
          <LearningMoreCell learning={row.original} refetch={refetch} />
        ),
        size: 33,
      },
      {
        id: 'statement',
        accessorKey: 'statement',
        header: () => (
          <SortableHead
            icon={IconBulb}
            label="Learning"
            columnId="statement"
            sort={sort}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => (
          <LearningStatementCell
            learning={row.original}
            setSelected={setSelected}
          />
        ),
        size: 420,
      },
      {
        id: 'type',
        accessorKey: 'type',
        header: () => (
          <SortableHead
            icon={IconCategory}
            label="Type"
            columnId="type"
            sort={sort}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => (
          <RecordTableInlineCell>
            <IconBadge icon={IconCategory} variant="secondary">
              {row.original.type}
            </IconBadge>
          </RecordTableInlineCell>
        ),
        size: 130,
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: () => (
          <SortableHead
            icon={IconActivity}
            label="Status"
            columnId="status"
            sort={sort}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => (
          <RecordTableInlineCell>
            <IconBadge
              icon={IconActivity}
              variant={statusVariant(row.original.status)}
            >
              {row.original.status}
            </IconBadge>
          </RecordTableInlineCell>
        ),
        size: 120,
      },
      {
        id: 'confidence',
        accessorKey: 'confidence',
        header: () => (
          <SortableHead
            icon={IconChartBar}
            label="Confidence"
            columnId="confidence"
            sort={sort}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => (
          <RecordTableInlineCell>
            <span className="flex items-center gap-1 font-mono text-xs">
              <IconChartBar className="size-3.5 text-muted-foreground" />
              {confidencePct(row.original.confidence)}
            </span>
          </RecordTableInlineCell>
        ),
        size: 100,
      },
      {
        id: 'sourceCount',
        accessorKey: 'sourceCount',
        header: () => (
          <SortableHead
            icon={IconUsers}
            label="Sources"
            columnId="sourceCount"
            sort={sort}
            onSort={onSort}
          />
        ),
        cell: ({ row }) => (
          <RecordTableInlineCell>
            <span className="flex items-center gap-1 text-sm tabular-nums">
              <IconUsers className="size-3.5 text-muted-foreground" />
              {row.original.sourceCount ?? 0}
            </span>
          </RecordTableInlineCell>
        ),
        size: 90,
      },
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
    ],
    [refetch, setSelected, sort, onSort],
  );
