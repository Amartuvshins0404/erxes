/* eslint-disable react-hooks/rules-of-hooks */
import {
  IconCalendar,
  IconDots,
  IconEdit,
  IconFlag,
  IconPhoto,
  IconTag,
  IconTrash,
} from '@tabler/icons-react';
import { ColumnDef } from '@tanstack/table-core';
import { format } from 'date-fns';
import {
  Avatar,
  Button,
  DropdownMenu,
  RecordTable,
  RecordTableInlineCell,
} from 'erxes-ui';
import { readImage } from 'erxes-ui/utils/core';
import { MtoTravelAssociation } from '@/travelAssociation/types/travelAssociation';

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'MMM dd, yyyy');
};

export const travelAssociationColumns = ({
  onEdit,
  onRemove,
}: {
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}): ColumnDef<MtoTravelAssociation>[] => [
  {
    id: 'title',
    accessorKey: 'title',
    header: () => <RecordTable.InlineHead label="Title" icon={IconTag} />,
    cell: ({ row }) => {
      const { title, logo } = row.original;
      return (
        <RecordTableInlineCell className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar size="xl" className="rounded">
              {logo ? (
                <Avatar.Image src={readImage(logo)} alt={title?.en || ''} />
              ) : null}
              <Avatar.Fallback className="rounded">
                <IconPhoto className="size-4 text-muted-foreground" />
              </Avatar.Fallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium truncate">{title?.en || '—'}</span>
              {title?.mn ? (
                <span className="text-xs text-muted-foreground truncate">
                  {title.mn}
                </span>
              ) : null}
            </div>
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 280,
  },
  {
    id: 'foundDate',
    accessorKey: 'foundDate',
    header: () => (
      <RecordTable.InlineHead label="Found date" icon={IconFlag} />
    ),
    cell: ({ cell }) => {
      const label = formatDate(cell.getValue() as string | undefined);
      return (
        <RecordTableInlineCell>
          {label || <span className="text-muted-foreground">—</span>}
        </RecordTableInlineCell>
      );
    },
    size: 140,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => (
      <RecordTable.InlineHead label="Created" icon={IconCalendar} />
    ),
    cell: ({ cell }) => {
      const label = formatDate(cell.getValue() as string | undefined);
      return (
        <RecordTableInlineCell>
          {label || <span className="text-muted-foreground">—</span>}
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
