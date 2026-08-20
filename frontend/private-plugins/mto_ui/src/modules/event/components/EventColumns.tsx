/* eslint-disable react-hooks/rules-of-hooks */
import {
  IconCalendar,
  IconCategory,
  IconDots,
  IconEdit,
  IconMapPin,
  IconProgressCheck,
  IconTag,
  IconTrash,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import { format } from 'date-fns';
import {
  Badge,
  Button,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
} from 'erxes-ui';
import { MtoEvent, MtoEventCategory } from '@/event/types/event';

const formatCategoryNames = (categories?: MtoEventCategory[]) => {
  if (!categories?.length) return null;
  const labels = categories
    .map((category) => category.name?.en || category.name?.mn)
    .filter(Boolean);
  return labels.length ? labels.join(', ') : null;
};

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const eventColumns = ({
  onEdit,
  onRemove,
}: {
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}): ColumnDef<MtoEvent>[] => [
  {
    id: 'title',
    accessorKey: 'title',
    header: () => <RecordTable.InlineHead label="Title" icon={IconTag} />,
    cell: ({ cell }) => {
      const title = cell.getValue() as MtoEvent['title'];
      return (
        <RecordTableInlineCell className="min-w-0">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="font-medium truncate">{title?.en || '—'}</span>
            {title?.mn ? (
              <span className="text-xs text-muted-foreground truncate">
                {title.mn}
              </span>
            ) : null}
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 240,
  },
  {
    id: 'categories',
    accessorKey: 'categories',
    header: () => (
      <RecordTable.InlineHead label="Categories" icon={IconCategory} />
    ),
    cell: ({ cell }) => {
      const label = formatCategoryNames(
        cell.getValue() as MtoEventCategory[] | undefined,
      );
      return (
        <RecordTableInlineCell className="min-w-0">
          {label ? (
            <span className="truncate">{label}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 180,
  },
  {
    id: 'location',
    accessorKey: 'location',
    header: () => (
      <RecordTable.InlineHead label="Location" icon={IconMapPin} />
    ),
    cell: ({ cell }) => {
      const location = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell className="min-w-0">
          {location ? (
            <span className="truncate">{location}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 140,
  },
  {
    id: 'schedule',
    header: () => (
      <RecordTable.InlineHead label="Schedule" icon={IconCalendar} />
    ),
    cell: ({ row }) => {
      const start = formatDate(row.original.startDate);
      const end = formatDate(row.original.endDate);
      return (
        <RecordTableInlineCell className="min-w-0">
          <div className="flex flex-col gap-0.5 text-xs whitespace-nowrap">
            <span>{start || '—'}</span>
            <span className="text-muted-foreground">{end || '—'}</span>
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 160,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => (
      <RecordTable.InlineHead label="Status" icon={IconProgressCheck} />
    ),
    cell: ({ cell, row }) => {
      const status = cell.getValue() as string | undefined;
      const active = row.original.isActive;
      return (
        <RecordTableInlineCell>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={status === 'published' ? 'success' : 'secondary'}>
              {status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            <Badge variant={active ? 'success' : 'secondary'}>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 180,
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
