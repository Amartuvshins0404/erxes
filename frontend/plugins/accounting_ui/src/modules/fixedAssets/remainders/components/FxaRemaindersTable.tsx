import type { TFunction } from 'i18next';
import { getI18n, useTranslation } from 'react-i18next';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';
import {
  RecordTable,
  RecordTableInlineCell,
  Skeleton,
  Table,
  TextOverflowTooltip,
} from 'erxes-ui';
import { IconBuildingOff } from '@tabler/icons-react';
import { useStructureEntities } from 'ui-modules';
import { AccountingEmptyState } from '@/layout/components/AccountingEmptyState';
import { useFixedAssetCategories } from '@/settings/fixed-assets/hooks/useFixedAssetCategories';
import { useFixedAssets } from '@/settings/fixed-assets/hooks/useFixedAssets';
import {
  IFixedAsset,
  IFixedAssetCategory,
  IFixedAssetLocationRemainder,
} from '@/settings/fixed-assets/types/FixedAsset';
import { useFixedAssetRemainders } from '@/fixedAssets/remainders/hooks/useFixedAssetRemainders';

type TLabelItem = {
  code?: string;
  title?: string;
};

type TFxaRemainderRow = IFixedAssetLocationRemainder & {
  categoryId?: string;
};

const GENERAL_LABEL = 'general';

const formatCount = (value?: number) =>
  (value || 0).toLocaleString(undefined, { maximumFractionDigits: 4 });

const joinFixedAssetLabel = (fixedAsset?: IFixedAsset) =>
  fixedAsset ? `${fixedAsset.code} - ${fixedAsset.name}` : '-';

const joinCategoryLabel = (category?: IFixedAssetCategory) =>
  category ? `${category.code} - ${category.name}` : '-';

const joinLocationLabel = (id?: string, object?: TLabelItem) => {
  if (!id) {
    return getI18n().t(GENERAL_LABEL, { ns: 'accounting' });
  }

  const label = [object?.code, object?.title].filter(Boolean).join(' - ');

  return label || getI18n().t('not-found', { ns: 'accounting' });
};

const getFxaRemainderColumns = ({
  categoriesById,
  entitiesById,
  fixedAssetsById,
  t,
}: {
  categoriesById: Record<string, IFixedAssetCategory>;
  entitiesById: Record<string, TLabelItem>;
  fixedAssetsById: Record<string, IFixedAsset>;
  t: TFunction<'accounting'>;
}): ColumnDef<TFxaRemainderRow>[] => [
  {
    id: 'fixedAssetId',
    accessorKey: 'fixedAssetId',
    header: () => <RecordTable.InlineHead label={t('fixed-assets')} />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip
          value={joinFixedAssetLabel(
            row.original.fixedAssetId
              ? fixedAssetsById[row.original.fixedAssetId]
              : undefined,
          )}
        />
      </RecordTableInlineCell>
    ),
    size: 280,
  },
  {
    id: 'categoryId',
    accessorKey: 'categoryId',
    header: () => <RecordTable.InlineHead label={t('category-label')} />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip
          value={joinCategoryLabel(
            row.original.categoryId
              ? categoriesById[row.original.categoryId]
              : undefined,
          )}
        />
      </RecordTableInlineCell>
    ),
    size: 220,
  },
  {
    id: 'placeEntityId',
    accessorKey: 'placeEntityId',
    header: () => <RecordTable.InlineHead label={t('place', 'Place')} />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip
          value={joinLocationLabel(
            row.original.placeEntityId,
            row.original.placeEntityId
              ? entitiesById[row.original.placeEntityId]
              : undefined,
          )}
        />
      </RecordTableInlineCell>
    ),
    size: 220,
  },
  {
    id: 'responsibleEntityId',
    accessorKey: 'responsibleEntityId',
    header: () => (
      <RecordTable.InlineHead label={t('responsible', 'Responsible')} />
    ),
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip
          value={joinLocationLabel(
            row.original.responsibleEntityId,
            row.original.responsibleEntityId
              ? entitiesById[row.original.responsibleEntityId]
              : undefined,
          )}
        />
      </RecordTableInlineCell>
    ),
    size: 220,
  },
  {
    id: 'remainder',
    accessorKey: 'remainder',
    header: () => <RecordTable.InlineHead label={t('remainder')} />,
    cell: ({ row }) => (
      <RecordTableInlineCell>
        {formatCount(row.original.remainder)}
      </RecordTableInlineCell>
    ),
    size: 120,
  },
];

const FxaRemaindersSkeleton = ({ rows = 20 }: { rows?: number }) => {
  const rowKeys = useMemo(
    () =>
      Array.from({ length: rows }, (_, index) => `fxa-rem-skeleton-${index}`),
    [rows],
  );

  return (
    <>
      {rowKeys.map((rowKey) => (
        <Table.Row key={rowKey} className="h-cell">
          {Array.from({ length: 5 }, (_, index) => (
            <Table.Cell key={`${rowKey}-${index}`} className="border-r-0 px-2">
              <Skeleton className="h-4 w-full min-w-4" />
            </Table.Cell>
          ))}
        </Table.Row>
      ))}
    </>
  );
};

export const FxaRemaindersTable = () => {
  const { t } = useTranslation('accounting');
  const { fixedAssetRemainders, loading, error } = useFixedAssetRemainders();
  const fixedAssetIds = [
    ...new Set(
      fixedAssetRemainders
        .map((item) => item.fixedAssetId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const entityIds = [
    ...new Set(
      fixedAssetRemainders
        .flatMap((item) => [item.placeEntityId, item.responsibleEntityId])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const { fixedAssets, loading: loadingFixedAssets } = useFixedAssets({
    variables: { ids: fixedAssetIds },
    skip: fixedAssetIds.length === 0,
  });
  const { fixedAssetCategories, loading: loadingCategories } =
    useFixedAssetCategories();
  const { structureEntities, loading: loadingEntities } = useStructureEntities({
    variables: {
      ids: entityIds,
      limit: entityIds.length,
      includeArchived: true,
    },
    skip: entityIds.length === 0,
  });
  const fixedAssetsById = useMemo(
    () =>
      (fixedAssets || []).reduce<Record<string, IFixedAsset>>(
        (result, fixedAsset) => ({
          ...result,
          [fixedAsset._id]: fixedAsset,
        }),
        {},
      ),
    [fixedAssets],
  );
  const categoriesById = useMemo(
    () =>
      (fixedAssetCategories || []).reduce<Record<string, IFixedAssetCategory>>(
        (result, category) => ({
          ...result,
          [category._id]: category,
        }),
        {},
      ),
    [fixedAssetCategories],
  );
  const entitiesById = useMemo(
    () =>
      structureEntities.reduce<Record<string, TLabelItem>>(
        (result, entity) => ({
          ...result,
          [entity._id]: entity,
        }),
        {},
      ),
    [structureEntities],
  );
  const rows = useMemo<TFxaRemainderRow[]>(
    () =>
      fixedAssetRemainders.map((item) => ({
        ...item,
        categoryId: item.fixedAssetId
          ? fixedAssetsById[item.fixedAssetId]?.categoryId
          : undefined,
      })),
    [fixedAssetRemainders, fixedAssetsById],
  );
  const columns = useMemo(
    () =>
      getFxaRemainderColumns({
        categoriesById,
        entitiesById,
        fixedAssetsById,
        t,
      }),
    [categoriesById, entitiesById, fixedAssetsById, t],
  );
  const isInitialLoading =
    loading || loadingFixedAssets || loadingCategories || loadingEntities;

  const isEmpty = !isInitialLoading && !rows.length;

  return (
    <RecordTable.Provider
      columns={columns}
      data={isInitialLoading ? [] : rows}
      stickyColumns={['fixedAssetId']}
      tableId="accounting_fxa_remainders_table"
      className="relative m-3"
    >
      <RecordTable.Scroll>
        <RecordTable>
          <RecordTable.Header showColumnSelector />
          <RecordTable.Body>
            <RecordTable.RowList />
            {isInitialLoading && <FxaRemaindersSkeleton rows={20} />}
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.Scroll>
      {isEmpty && (
        <AccountingEmptyState
          overlay
          error={error}
          icon={IconBuildingOff}
          title={t('no-balance-found')}
          description={t('empty-generated-description')}
        />
      )}
    </RecordTable.Provider>
  );
};
