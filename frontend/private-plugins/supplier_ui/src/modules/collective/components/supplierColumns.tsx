import { ColumnDef } from '@tanstack/table-core';
import { Avatar, Badge, RecordTable, RecordTableInlineCell } from 'erxes-ui';

export interface ICollectiveSupplier {
  _id: string;
  name?: string;
  logo?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  verificationStatus?: string;
}

const statusVariant = (status?: string) => {
  switch (status) {
    case 'verified':
      return 'success' as const;
    case 'unverified':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

export const supplierColumns: ColumnDef<ICollectiveSupplier>[] = [
  RecordTable.checkboxColumn as ColumnDef<ICollectiveSupplier>,
  {
    id: 'name',
    accessorKey: 'name',
    header: 'name',
    cell: ({ row }) => {
      const { name, logo } = row.original;
      return (
        <RecordTableInlineCell className="flex items-center gap-2">
          <Avatar className="size-6">
            {logo ? (
              <Avatar.Image src={logo} alt={name || ''} />
            ) : (
              <Avatar.Fallback>
                {(name || '?').slice(0, 1).toUpperCase()}
              </Avatar.Fallback>
            )}
          </Avatar>
          <span className="font-medium truncate">{name || 'Unnamed'}</span>
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'primaryEmail',
    accessorKey: 'primaryEmail',
    header: 'email',
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-sm">
        {(cell.getValue() as string) || '—'}
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'primaryPhone',
    accessorKey: 'primaryPhone',
    header: 'phone',
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-sm">
        {(cell.getValue() as string) || '—'}
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'verificationStatus',
    accessorKey: 'verificationStatus',
    header: 'status',
    size: 40,
    cell: ({ cell }) => {
      const value = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell className="flex justify-center items-center">
          <Badge variant={statusVariant(value)}>{value || 'pending'}</Badge>
        </RecordTableInlineCell>
      );
    },
  },
];
