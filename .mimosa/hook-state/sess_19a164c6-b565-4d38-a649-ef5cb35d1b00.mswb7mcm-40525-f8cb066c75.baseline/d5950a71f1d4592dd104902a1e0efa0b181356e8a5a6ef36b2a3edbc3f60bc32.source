/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from '@tanstack/react-table';
import {
  Badge,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  useQueryState,
} from 'erxes-ui';
import {
  IconCalendar,
  IconCheck,
  IconCircleX,
  IconLabelFilled,
  IconUsers,
  IconWorld,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ICollective } from '../types';

const statusVariant = (status?: string) => {
  if (status === 'active') return 'success' as const;
  if (status === 'failed') return 'destructive' as const;
  if (status === 'syncing') return 'info' as const;
  return 'secondary' as const;
};

export const collectivesColumns: ColumnDef<ICollective>[] = [
  RecordTable.checkboxColumn as ColumnDef<ICollective>,
  {
    id: 'name',
    accessorKey: 'name',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Name')} icon={IconLabelFilled} />;
    },
    cell: ({ cell, row }) => {
      const [, setActiveCollectiveId] = useQueryState<string>(
        'activeCollectiveId',
      );
      return (
        <RecordTableInlineCell>
          <Badge
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCollectiveId(row.original._id);
            }}
          >
            {(cell.getValue() as string) || '-'}
          </Badge>
        </RecordTableInlineCell>
      );
    },
    size: 240,
  },
  {
    id: 'targetSubdomain',
    accessorKey: 'targetSubdomain',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead label={t('Target subdomain')} icon={IconWorld} />
      );
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as string) || '-'}
      </RecordTableInlineCell>
    ),
    size: 220,
  },
  {
    id: 'suppliersCount',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Suppliers')} icon={IconUsers} />;
    },
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <Badge variant="secondary">
          {row.original.supplierIds?.length ?? 0}
        </Badge>
      </RecordTableInlineCell>
    ),
    size: 110,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Status')} icon={IconCheck} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <Badge variant={statusVariant(cell.getValue() as string)}>
          {(cell.getValue() as string) || 'pending'}
        </Badge>
      </RecordTableInlineCell>
    ),
    size: 130,
  },
  {
    id: 'totalCreated',
    accessorKey: 'totalCreated',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Created')} icon={IconCheck} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as number) ?? 0}
      </RecordTableInlineCell>
    ),
    size: 100,
  },
  {
    id: 'totalFailed',
    accessorKey: 'totalFailed',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Failed')} icon={IconCircleX} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as number) ?? 0}
      </RecordTableInlineCell>
    ),
    size: 100,
  },
  {
    id: 'lastSyncedAt',
    accessorKey: 'lastSyncedAt',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead label={t('Last sync')} icon={IconCalendar} />
      );
    },
    cell: ({ cell }) => {
      const value = cell.getValue() as string | undefined;
      if (!value) {
        return <RecordTableInlineCell>-</RecordTableInlineCell>;
      }
      return (
        <RelativeDateDisplay value={value} asChild>
          <RecordTableInlineCell>
            <RelativeDateDisplay.Value value={value} />
          </RecordTableInlineCell>
        </RelativeDateDisplay>
      );
    },
    size: 160,
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead label={t('Created at')} icon={IconCalendar} />
      );
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
