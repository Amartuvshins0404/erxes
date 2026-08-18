/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from '@tanstack/react-table';
import {
  Badge,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
  TextOverflowTooltip,
  useQueryState,
} from 'erxes-ui';
import {
  IconBarcode,
  IconCalendar,
  IconCategory,
  IconCoin,
  IconLabelFilled,
  IconRuler,
  IconShieldCheck,
  IconTag,
  IconUser,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { IMushopProduct } from '../types';
import { ProductStatusAction } from './ProductStatusAction';
import { ProductCategoryAssign } from './ProductCategoryAssign';

const statusVariant = (status?: string) => {
  if (status === 'approved') return 'success';
  if (status === 'rejected') return 'destructive';
  return 'secondary';
};

export const productColumns: ColumnDef<IMushopProduct>[] = [
  RecordTable.checkboxColumn as ColumnDef<IMushopProduct>,
  {
    id: 'name',
    accessorKey: 'name',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Name')} icon={IconLabelFilled} />;
    },
    cell: ({ cell, row }) => {
      const [, setActiveProductId] =
        useQueryState<string>('activeProductId');
      return (
        <RecordTableInlineCell
          onClick={() => setActiveProductId(row.original._id)}
        >
          <TextOverflowTooltip value={cell.getValue() as string} />
        </RecordTableInlineCell>
      );
    },
    size: 240,
  },
  {
    id: 'code',
    accessorKey: 'code',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Code')} icon={IconBarcode} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={cell.getValue() as string} />
      </RecordTableInlineCell>
    ),
    size: 140,
  },
  {
    id: 'type',
    accessorKey: 'type',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Type')} icon={IconTag} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={cell.getValue() as string} />
      </RecordTableInlineCell>
    ),
    size: 120,
  },
  {
    id: 'unitPrice',
    accessorKey: 'unitPrice',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Unit Price')} icon={IconCoin} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        {cell.getValue() != null
          ? (cell.getValue() as number).toLocaleString()
          : '-'}
      </RecordTableInlineCell>
    ),
    size: 140,
  },
  {
    id: 'uom',
    accessorKey: 'uom',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('UOM')} icon={IconRuler} />;
    },
    cell: ({ cell }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={cell.getValue() as string} />
      </RecordTableInlineCell>
    ),
    size: 100,
  },
  {
    id: 'category',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Category')} icon={IconCategory} />;
    },
    cell: ({ row }) => (
      <ProductCategoryAssign.Provider
        productId={row.original._id}
        categoryId={row.original.categoryId}
        category={row.original.category}
        initialCategory={row.original.initialCategory}
      >
        <ProductCategoryAssign.InlineCell />
      </ProductCategoryAssign.Provider>
    ),
    size: 200,
  },
  {
    id: 'supplier',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Supplier')} icon={IconUser} />;
    },
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip value={row.original.supplier?.name || '-'} />
      </RecordTableInlineCell>
    ),
    size: 160,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: () => {
      const { t } = useTranslation('mushop');
      return <RecordTable.InlineHead label={t('Status')} icon={IconShieldCheck} />;
    },
    cell: ({ cell, row }) => {
      const { t } = useTranslation('mushop');
      return (
        <RecordTableInlineCell>
          <ProductStatusAction
            productId={row.original._id}
            status={cell.getValue() as string}
          >
            <Badge variant={statusVariant(cell.getValue() as string)}>
              {t((cell.getValue() as string) || 'pending')}
            </Badge>
          </ProductStatusAction>
        </RecordTableInlineCell>
      );
    },
    size: 140,
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
