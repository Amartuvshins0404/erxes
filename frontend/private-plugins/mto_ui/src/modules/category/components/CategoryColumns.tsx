/* eslint-disable react-hooks/rules-of-hooks */
import {
  IconCalendar,
  IconDots,
  IconEdit,
  IconLayersSubtract,
  IconProgress,
  IconTag,
  IconTrash,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { isMainCategory } from '@/category/hooks/useCategoryOptions';
import { MtoCategory } from '@/category/types/category';

export const categoryColumns = ({
  onEdit,
  onRemove,
}: {
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}): ColumnDef<MtoCategory>[] => [
  {
    id: 'name',
    accessorKey: 'name',
    header: () => <RecordTable.InlineHead label="Name" icon={IconTag} />,
    cell: ({ cell }) => {
      const name = cell.getValue() as MtoCategory['name'];
      return (
        <RecordTableInlineCell className="min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-medium truncate">{name?.en || '—'}</span>
            {name?.mn ? (
              <span className="text-xs text-muted-foreground truncate">
                {name.mn}
              </span>
            ) : null}
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 280,
  },
  {
    id: 'level',
    header: () => (
      <RecordTable.InlineHead label="Level" icon={IconLayersSubtract} />
    ),
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
    size: 100,
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: () => (
      <RecordTable.InlineHead label="Status" icon={IconProgress} />
    ),
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
    size: 110,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => (
      <RecordTable.InlineHead label="Created" icon={IconCalendar} />
    ),
    cell: ({ cell }) => {
      const value = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell>
          {value ? (
            <RelativeDateDisplay value={value} asChild>
              <RelativeDateDisplay.Value value={value} />
            </RelativeDateDisplay>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 140,
  },
  {
    id: 'actions',
    header: () => <span />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <IconDots className="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content className="mto:min-w-36" align="end">
            <DropdownMenu.Item
              className="cursor-pointer"
              onClick={() => onEdit(row.original._id)}
            >
              <IconEdit className="size-4" />
              <span>Edit</span>
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onRemove(row.original._id)}
            >
              <IconTrash className="size-4" />
              <span>Delete</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </RecordTableInlineCell>
    ),
    size: 50,
  },
];
