import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Command,
  Popover,
  RecordTable,
  RecordTableInlineCell,
  toast,
  useQueryState,
} from 'erxes-ui';
import { useState } from 'react';
import { ICollectivePackage } from '../hooks/useCollectivePackages';
import { useEditCollectivePackageStatus } from '../hooks/useEditCollectivePackageStatus';

const PACKAGE_STATUSES = ['draft', 'active', 'archived'] as const;

const statusVariant = (status?: string) => {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'archived':
      return 'secondary' as const;
    default:
      return 'info' as const;
  }
};

const StatusCell = ({ pkg }: { pkg: ICollectivePackage }) => {
  const [open, setOpen] = useState(false);
  const { editStatus, loading } = useEditCollectivePackageStatus();
  const current = pkg.status || 'draft';

  const handleSelect = async (next: string) => {
    setOpen(false);
    if (next === current) return;

    try {
      await editStatus({ variables: { _id: pkg._id, status: next } });
      toast({ variant: 'success', title: 'Status updated' });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update status',
        description: e?.message,
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <RecordTableInlineCell.Trigger disabled={loading}>
        <Badge variant={statusVariant(current)}>{current}</Badge>
      </RecordTableInlineCell.Trigger>
      <RecordTableInlineCell.Content className="w-36 min-w-0">
        <Command>
          <Command.List>
            {PACKAGE_STATUSES.map((s) => (
              <Command.Item
                key={s}
                value={s}
                onSelect={() => handleSelect(s)}
              >
                <Badge variant={statusVariant(s)}>{s}</Badge>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </RecordTableInlineCell.Content>
    </Popover>
  );
};

const formatPrice = (value?: number) =>
  value == null
    ? '—'
    : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
        value,
      );

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

export const packageColumns: ColumnDef<ICollectivePackage>[] = [
  RecordTable.checkboxColumn as ColumnDef<ICollectivePackage>,
  {
    id: 'name',
    accessorKey: 'name',
    header: 'name',
    cell: ({ row }) => {
      const [, setActivePackageId] = useQueryState<string>('activePackageId');
      return (
        <RecordTableInlineCell>
          <Badge
            variant="secondary"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setActivePackageId(row.original._id);
            }}
          >
            {row.original.name || 'Unnamed'}
          </Badge>
        </RecordTableInlineCell>
      );
    },
  },
  {
    id: 'productCount',
    header: 'products',
    cell: ({ row }) => (
      <RecordTableInlineCell className="text-sm">
        {row.original.productIds?.length ?? 0}
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'price',
    accessorKey: 'price',
    header: 'price',
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-sm">
        {formatPrice(cell.getValue() as number | undefined)}
      </RecordTableInlineCell>
    ),
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'status',
    size: 40,
    cell: ({ row }) => <StatusCell pkg={row.original} />,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'created',
    cell: ({ cell }) => (
      <RecordTableInlineCell className="text-sm">
        {formatDate(cell.getValue() as string | undefined)}
      </RecordTableInlineCell>
    ),
  },
];
