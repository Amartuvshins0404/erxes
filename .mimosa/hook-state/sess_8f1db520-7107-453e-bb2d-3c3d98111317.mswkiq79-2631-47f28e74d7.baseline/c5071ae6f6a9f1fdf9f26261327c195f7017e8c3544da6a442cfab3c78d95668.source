/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from '@tanstack/react-table';
import {
  Badge,
  RecordTable,
  RecordTableInlineCell,
  useQueryState,
} from 'erxes-ui';
import {
  IconCalendar,
  IconCash,
  IconClockHour4,
  IconProgress,
  IconUser,
  IconPackage,
} from '@tabler/icons-react';
import { CustomersInline } from 'ui-modules';
import { useTranslation } from 'react-i18next';
import { IMember } from '../types';
import { SelectMemberStatus } from './SelectMemberStatus';

const statusVariant = (status?: string) => {
  if (status === 'active') return 'success' as const;
  if (status === 'expired') return 'destructive' as const;
  return 'secondary' as const;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '?';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const membersColumns: ColumnDef<IMember>[] = [
  RecordTable.checkboxColumn as ColumnDef<IMember>,
  {
    id: 'customerId',
    accessorKey: 'customerId',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Customer')} icon={IconUser} />;
    },
    cell: ({ cell, row }) => {
      const [, setActiveMemberId] =
        useQueryState<string>('activeMemberId');
      const customerId = cell.getValue() as string;
      const { customer } = row.original;
      return (
        <RecordTableInlineCell
          onClick={() => setActiveMemberId(row.original._id)}
        >
          <CustomersInline
            customerIds={[customerId]}
            customers={customer ? [customer] : undefined}
            placeholder="—"
          />
        </RecordTableInlineCell>
      );
    },
    size: 220,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Status')} icon={IconProgress} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <Badge variant={statusVariant(cell.getValue() as string)}>
          {(cell.getValue() as string) || '-'}
        </Badge>
      </RecordTableInlineCell>
    ),
    size: 120,
  },
  {
    id: 'plan',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Plan')} icon={IconPackage} />;
    },
    cell: ({ row }) => {
      const plan = row.original.plan;
      return (
        <RecordTableInlineCell>
          {plan ? `${plan.name} · ${plan.durationMonths}mo` : '-'}
        </RecordTableInlineCell>
      );
    },
    size: 160,
  },
  {
    id: 'amount',
    accessorKey: 'amount',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Amount')} icon={IconCash} />;
    },
    cell: ({ cell, row }) => {
      const amount = cell.getValue() as number;
      const currency = row.original.currency || 'MNT';
      return (
        <RecordTableInlineCell>
          {amount != null ? `${amount.toLocaleString()} ${currency}` : '-'}
        </RecordTableInlineCell>
      );
    },
    size: 140,
  },
  {
    id: 'timeLeft',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead label={t('Time Left')} icon={IconClockHour4} />
      );
    },
    cell: ({ row }) => {
      const { t } = useTranslation('mushop');
      const { endDate, status } = row.original;
      if (!endDate || status !== 'active') {
        return <RecordTableInlineCell>-</RecordTableInlineCell>;
      }
      const diff = Math.ceil(
        (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const label =
        diff <= 0 ? t('Expires today') : t('{{count}} day', { count: diff });
      return <RecordTableInlineCell>{label}</RecordTableInlineCell>;
    },
    size: 120,
  },
  {
    id: 'duration',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead
          label={t('Membership Period')}
          icon={IconCalendar}
        />
      );
    },
    cell: ({ row }) => {
      const { startDate, endDate } = row.original;
      return (
        <RecordTableInlineCell>
          {startDate && endDate
            ? `${formatDate(startDate)} → ${formatDate(endDate)}`
            : '-'}
        </RecordTableInlineCell>
      );
    },
    size: 260,
  },
  {
    id: 'joinedAt',
    accessorKey: 'createdAt',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead label={t('Joined At')} icon={IconCalendar} />
      );
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {formatDate(cell.getValue() as string)}
      </RecordTableInlineCell>
    ),
    size: 140,
  },
];
