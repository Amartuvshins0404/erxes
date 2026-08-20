import { IconEdit, IconTrash } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { MtoEvent, MtoEventCategory } from '@/event/types/event';

const formatCategoryNames = (categories?: MtoEventCategory[]) => {
  if (!categories?.length) return '—';

  return categories
    .map((category) => category.name?.en || category.name?.mn)
    .filter(Boolean)
    .join(', ');
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString();
};

export const eventColumns = ({
  onEdit,
  onRemove,
}: {
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}): ColumnDef<MtoEvent>[] => [
  {
    accessorKey: 'title',
    header: () => <RecordTable.InlineHead label="Title (EN)" />,
    cell: ({ cell }) => {
      const title = cell.getValue() as MtoEvent['title'];

      return (
        <RecordTableInlineCell className="font-medium max-w-[200px]">
          {title?.en || '—'}
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'titleMn',
    accessorKey: 'title',
    header: () => <RecordTable.InlineHead label="Title (MN)" />,
    cell: ({ cell }) => {
      const title = cell.getValue() as MtoEvent['title'];

      return (
        <RecordTableInlineCell className="max-w-[200px]">
          {title?.mn || '—'}
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'categories',
    accessorKey: 'categories',
    header: () => <RecordTable.InlineHead label="Categories" />,
    cell: ({ cell }) => (
      <RecordTableInlineCell className="max-w-[220px]">
        {formatCategoryNames(cell.getValue() as MtoEventCategory[])}
      </RecordTableInlineCell>
    ),
  },
  {
    accessorKey: 'location',
    header: () => <RecordTable.InlineHead label="Location" />,
    cell: ({ cell }) => (
      <RecordTableInlineCell className="max-w-[160px]">
        {(cell.getValue() as string) || '—'}
      </RecordTableInlineCell>
    ),
  },
  {
    accessorKey: 'startDate',
    header: () => <RecordTable.InlineHead label="Start" />,
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-xs whitespace-nowrap">
        {formatDateTime(cell.getValue() as string)}
      </RecordTableInlineCell>
    ),
  },
  {
    accessorKey: 'endDate',
    header: () => <RecordTable.InlineHead label="End" />,
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-xs whitespace-nowrap">
        {formatDateTime(cell.getValue() as string)}
      </RecordTableInlineCell>
    ),
  },
  {
    accessorKey: 'status',
    header: () => <RecordTable.InlineHead label="Status" />,
    cell: ({ cell }) => {
      const status = cell.getValue() as string;

      return (
        <RecordTableInlineCell>
          <Badge variant={status === 'published' ? 'success' : 'secondary'}>
            {status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </RecordTableInlineCell>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: () => <RecordTable.InlineHead label="Active" />,
    cell: ({ cell }) => {
      const active = cell.getValue() as boolean;

      return (
        <RecordTableInlineCell>
          <Badge variant={active ? 'success' : 'secondary'}>
            {active ? 'Active' : 'Inactive'}
          </Badge>
        </RecordTableInlineCell>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => <RecordTable.InlineHead label="Created" />,
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-xs">
        <RelativeDateDisplay value={cell.getValue() as string} asChild>
          <RelativeDateDisplay.Value value={cell.getValue() as string} />
        </RelativeDateDisplay>
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <RecordTableInlineCell className="flex justify-end items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onEdit(row.original._id)}
        >
          <IconEdit size={16} />
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={() => onRemove(row.original._id)}
        >
          <IconTrash size={16} />
        </Button>
      </RecordTableInlineCell>
    ),
  },
];
