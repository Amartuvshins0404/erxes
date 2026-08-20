import { IconEdit, IconTrash } from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { MtoCategory } from '@/category/types/category';
import { isMainCategory } from '@/category/hooks/useCategoryOptions';

export const categoryColumns = ({
  onEdit,
  onRemove,
}: {
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}): ColumnDef<MtoCategory>[] => [
  {
    accessorKey: 'name',
    header: () => <RecordTable.InlineHead label="Name (EN)" />,
    cell: ({ cell }) => {
      const name = cell.getValue() as MtoCategory['name'];

      return (
        <RecordTableInlineCell className="font-medium max-w-[200px]">
          {name?.en || '—'}
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'nameMn',
    accessorKey: 'name',
    header: () => <RecordTable.InlineHead label="Name (MN)" />,
    cell: ({ cell }) => {
      const name = cell.getValue() as MtoCategory['name'];

      return (
        <RecordTableInlineCell className="max-w-[200px]">
          {name?.mn || '—'}
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'level',
    header: () => <RecordTable.InlineHead label="Level" />,
    cell: ({ row }) => {
      const main = isMainCategory(row.original);

      return (
        <RecordTableInlineCell>
          <Badge variant={main ? 'default' : 'secondary'}>
            {main ? 'Main' : 'Sub'}
          </Badge>
        </RecordTableInlineCell>
      );
    },
  },
  {
    accessorKey: 'isActive',
    header: () => <RecordTable.InlineHead label="Status" />,
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
