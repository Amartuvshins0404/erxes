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
  IconLabelFilled,
  IconMail,
  IconMapPin,
  IconPhone,
  IconShieldCheck,
  IconStar,
  IconUser,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { ISupplier } from '../types';
import { SupplierVerificationAction } from './SupplierVerificationAction';

const verificationVariant = (status?: string) => {
  if (status === 'verified') return 'success' as const;
  if (status === 'unverified') return 'destructive' as const;
  return 'secondary' as const;
};

export const suppliersColumns: ColumnDef<ISupplier>[] = [
  RecordTable.checkboxColumn as ColumnDef<ISupplier>,
  {
    id: 'avatar',
    header: () => <RecordTable.InlineHead icon={IconUser} label="" />,
    cell: ({ row }) => (
      <div className="flex items-center justify-center h-8">
        <Avatar size="lg">
          {row.original.logo ? (
            <Avatar.Image src={row.original.logo} />
          ) : (
            <Avatar.Fallback>
              <IconBuildingStore className="size-3" />
            </Avatar.Fallback>
          )}
        </Avatar>
      </div>
    ),
    size: 34,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Name')} icon={IconLabelFilled} />;
    },
    cell: ({ cell, row }) => {
      const [, setActiveSupplierId] = useQueryState<string>('activeSupplierId');
      return (
        <RecordTableInlineCell>
          <Badge
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSupplierId(row.original._id);
            }}
          >
            {cell.getValue() as string}
          </Badge>
        </RecordTableInlineCell>
      );
    },
    size: 240,
  },
  {
    id: 'primaryEmail',
    accessorKey: 'primaryEmail',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Email')} icon={IconMail} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as string) || '-'}
      </RecordTableInlineCell>
    ),
    size: 220,
  },
  {
    id: 'primaryPhone',
    accessorKey: 'primaryPhone',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Phone')} icon={IconPhone} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {(cell.getValue() as string) || '-'}
      </RecordTableInlineCell>
    ),
    size: 160,
  },
  {
    id: 'city',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('City')} icon={IconMapPin} />;
    },
    cell: ({ row }) => (
      <RecordTableInlineCell>
        {row.original.address?.details?.city || '-'}
      </RecordTableInlineCell>
    ),
    size: 160,
  },
  {
    id: 'tierLevel',
    accessorKey: 'tierLevel',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Tier')} icon={IconStar} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {cell.getValue() != null ? (
          <Badge variant="secondary">{cell.getValue() as number}</Badge>
        ) : (
          '-'
        )}
      </RecordTableInlineCell>
    ),
    size: 100,
  },
  {
    id: 'verificationStatus',
    accessorKey: 'verificationStatus',
    header: () => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTable.InlineHead
          label={t('Verification')}
          icon={IconShieldCheck}
        />
      );
    },
    cell: ({ cell, row }) => (
      <RecordTableInlineCell>
        <SupplierVerificationAction
          supplierId={row.original._id}
          status={cell.getValue() as string}
        >
          <Badge variant={verificationVariant(cell.getValue() as string)}>
            {(cell.getValue() as string) || 'unverified'}
          </Badge>
        </SupplierVerificationAction>
      </RecordTableInlineCell>
    ),
    size: 160,
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
