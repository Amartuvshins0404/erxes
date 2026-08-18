/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from '@tanstack/react-table';
import {
  Avatar,
  Badge,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  useQueryState,
} from 'erxes-ui';
import {
  IconBuildingStore,
  IconCalendar,
  IconProgress,
  IconReceipt,
  IconUser,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { IOrder } from '../types';
import { OrderResyncButton } from './OrderResyncButton';

const statusVariant = (status?: string) => {
  if (status === 'forwarded') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  if (status === 'cancelled') return 'secondary' as const;
  return 'warning' as const;
};

export const ordersColumns: ColumnDef<IOrder>[] = [
  RecordTable.checkboxColumn as ColumnDef<IOrder>,
  {
    id: 'entityId',
    accessorKey: 'entityId',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Order')} icon={IconReceipt} />;
    },
    cell: ({ cell, row }) => {
      const [, setActiveOrderId] = useQueryState<string>('activeOrderId');
      const entityId = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell>
          <Badge
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setActiveOrderId(row.original._id);
            }}
          >
            {entityId || `#${row.original._id.slice(-6)}`}
          </Badge>
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Status')} icon={IconProgress} />;
    },
    cell: ({ cell, row }) => {
      const status = cell.getValue() as string | undefined;
      return (
        <RecordTableInlineCell>
          <div className="flex items-center gap-1">
            <Badge variant={statusVariant(status)}>{status || 'pending'}</Badge>
            <OrderResyncButton orderId={row.original._id} status={status} />
          </div>
        </RecordTableInlineCell>
      );
    },
    size: 160,
  },
  {
    id: 'supplier',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead label={t('Supplier')} icon={IconBuildingStore} />
      );
    },
    cell: ({ row }) => {
      const supplier = row.original.supplier;
      return (
        <RecordTableInlineCell>
          {supplier ? (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                {supplier.logo ? (
                  <Avatar.Image src={supplier.logo} />
                ) : (
                  <Avatar.Fallback>
                    <IconBuildingStore className="size-3" />
                  </Avatar.Fallback>
                )}
              </Avatar>
              <span className="truncate">{supplier.name}</span>
            </div>
          ) : (
            '-'
          )}
        </RecordTableInlineCell>
      );
    },
    size: 200,
  },
  {
    id: 'customer',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Customer')} icon={IconUser} />;
    },
    cell: ({ row }) => {
      const customer = row.original.customer;
      const name = [customer?.firstName, customer?.lastName]
        .filter(Boolean)
        .join(' ');
      return (
        <RecordTableInlineCell>
          {name || customer?.primaryPhone || customer?.primaryEmail || '-'}
        </RecordTableInlineCell>
      );
    },
    size: 180,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Created')} icon={IconCalendar} />;
    },
    cell: ({ cell }) => (
      <RelativeDateDisplay value={cell.getValue() as string} asChild>
        <RecordTableInlineCell>
          <RelativeDateDisplay.Value value={cell.getValue() as string} />
        </RecordTableInlineCell>
      </RelativeDateDisplay>
    ),
    size: 160,
  },
];
