import { ColumnDef } from '@tanstack/table-core';
import { IListingInline } from '../types/listing';
import {
  Badge,
  Button,
  CurrencyDisplay,
  formatAmount,
  RecordTableInlineCell,
  toast,
  useConfirm,
} from 'erxes-ui';
import { format, formatDate } from 'date-fns';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useRemoveListing } from '../hooks/useRemoveListing';

export const listingColumns: ColumnDef<IListingInline>[] = [
  {
    id: 'title',
    accessorKey: 'title',
    header: 'title',
  },
  {
    id: 'agent',
    header: 'agent',
    size: 80,
    cell: ({ row }) => {
      const agent = row.original.agent;
      if (!agent) return null;
      const name = [agent.firstName, agent.lastName].filter(Boolean).join(' ');
      return (
        <RecordTableInlineCell className="text-sm">
          {name || agent.email || '-'}
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'pricing',
    accessorKey: 'pricing',
    header: 'price amount',
    cell: ({ cell }) => {
      const { amount, currency } = cell.row.original.pricing || {};
      return (
        <RecordTableInlineCell className="flex items-center justify-center">
          {amount != null ? (
            <>
              <CurrencyDisplay
                className="shrink"
                variant="code"
                code={currency}
              />
              <span className="grow">{formatAmount(amount, 'finance')}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </RecordTableInlineCell>
      );
    },
    size: 70,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'status',
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell className="flex items-center justify-center">
          <Badge
            variant={
              cell.getValue() === 'active'
                ? 'success'
                : cell.getValue() === 'inactive'
                ? 'warning'
                : cell.getValue() === 'sold'
                ? 'info'
                : 'secondary'
            }
          >
            {cell.row.original.status}
          </Badge>
        </RecordTableInlineCell>
      );
    },
    size: 30,
  },
  {
    id: 'viewCount',
    accessorKey: 'viewCount',
    header: 'views',
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell className="flex items-center justify-center">
          {cell.row.original.viewCount || 0}
        </RecordTableInlineCell>
      );
    },
    size: 30,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'created at',
    cell: ({ cell }) => {
      return (
        <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
          {formatDate(cell.getValue() as Date, 'yyyy-mm-dd')}
        </RecordTableInlineCell>
      );
    },
    size: 40,
  },
  {
    id: 'actions',
    header: 'actions',
    size: 40,
    cell: ({ row }) => <ListingRowActions listing={row.original} />,
  },
];

const ListingRowActions = ({ listing }: { listing: IListingInline }) => {
  const navigate = useNavigate();
  const { removeListing } = useRemoveListing();
  const { confirm } = useConfirm();

  const handleDelete = () => {
    confirm({
      message: 'Are you sure you want to delete this listing?',
      options: { okLabel: 'Delete' },
    }).then(() => {
      removeListing({
        variables: { _id: listing._id },
        onError: (error) =>
          toast({
            variant: 'destructive',
            title: 'Failed to delete listing',
            description: error.message,
          }),
      });
    });
  };

  return (
    <RecordTableInlineCell className="flex items-center justify-center gap-1">
      <Button variant="ghost" size="icon" onClick={() => navigate(listing._id)}>
        <IconPencil size={16} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
      >
        <IconTrash size={16} />
      </Button>
    </RecordTableInlineCell>
  );
};
