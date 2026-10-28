import { ColumnDef } from '@tanstack/table-core';
import { IconRefresh } from '@tabler/icons-react';
import {
  Button,
  RecordTable,
  RecordTableInlineCell,
  ScrollArea,
  Sheet,
  Spinner,
  TextOverflowTooltip,
} from 'erxes-ui';
import { useAtom } from 'jotai';
import { useStructureEntities } from 'ui-modules';
import type { TFunction } from 'i18next';
import { getI18n, useTranslation } from 'react-i18next';
import { useReCalcRemainders } from '../hooks/useReCalcRemainders';
import { selectedRemainderProductAtom } from '../states/productDetailStates';

type InventoryEntry = {
  placeEntityId: string;
  remainder: number;
  cost: number;
  soonIn: number;
  soonOut: number;
};

type TPlaceInventory = {
  remainder?: number;
  cost?: number;
  soonIn?: number;
  soonOut?: number;
};

const parseInventories = (inventories: unknown): InventoryEntry[] => {
  if (!inventories || typeof inventories !== 'object') return [];

  return Object.entries(
    inventories as Record<string, TPlaceInventory | null>,
  ).flatMap(([placeEntityId, data]) =>
    data && typeof data === 'object'
      ? [
          {
            placeEntityId,
            remainder: data.remainder ?? 0,
            cost: data.cost ?? 0,
            soonIn: data.soonIn ?? 0,
            soonOut: data.soonOut ?? 0,
          },
        ]
      : [],
  );
};

const fmt = (v: number) =>
  v === 0 ? '' : v.toLocaleString(undefined, { maximumFractionDigits: 4 });

type LabelMap = Record<string, { code?: string; title?: string }>;

const INVENTORY_GENERAL_KEY = '_';
const GENERAL_LABEL = 'general';

const joinLabel = (id: string, object: LabelMap[string] | undefined) => {
  if (id === INVENTORY_GENERAL_KEY) {
    return getI18n().t(GENERAL_LABEL, { ns: 'accounting' });
  }

  const { code, title } = object || {};
  return (
    [code, title].filter(Boolean).join('') ||
    getI18n().t('not-found', { ns: 'accounting' })
  );
};

const buildInventoryColumns = (
  placeMap: LabelMap,
  t: TFunction<'accounting'>,
): ColumnDef<InventoryEntry>[] => [
  {
    id: 'placeEntity',
    header: t('place', 'Place'),
    cell: ({ row }) => (
      <RecordTableInlineCell>
        <TextOverflowTooltip
          value={joinLabel(
            row.original.placeEntityId,
            placeMap[row.original.placeEntityId],
          )}
        />
      </RecordTableInlineCell>
    ),
    size: 220,
  },
  {
    id: 'remainder',
    header: t('remainder'),
    cell: ({ row }) => (
      <RecordTableInlineCell>
        {fmt(row.original.remainder)}
      </RecordTableInlineCell>
    ),
    size: 120,
  },
  {
    id: 'cost',
    header: t('cost'),
    cell: ({ row }) => (
      <RecordTableInlineCell>{fmt(row.original.cost)}</RecordTableInlineCell>
    ),
    size: 120,
  },
  {
    id: 'soonIn',
    header: t('pending-receipts'),
    cell: ({ row }) => (
      <RecordTableInlineCell>{fmt(row.original.soonIn)}</RecordTableInlineCell>
    ),
    size: 120,
  },
  {
    id: 'soonOut',
    header: t('pending-issues'),
    cell: ({ row }) => (
      <RecordTableInlineCell>{fmt(row.original.soonOut)}</RecordTableInlineCell>
    ),
    size: 120,
  },
];

type InventoriesTableProps = {
  inventories: unknown;
};

export const InventoriesTable = ({ inventories }: InventoriesTableProps) => {
  const { t } = useTranslation('accounting');
  const rows = parseInventories(inventories);

  const placeEntityIds = [...new Set(rows.map((r) => r.placeEntityId))].filter(
    (id) => id !== INVENTORY_GENERAL_KEY,
  );

  const { structureEntities, loading } = useStructureEntities({
    variables: {
      ids: placeEntityIds,
      limit: placeEntityIds.length,
      includeArchived: true,
    },
    skip: placeEntityIds.length === 0,
  });

  const placeMap: LabelMap = Object.fromEntries(
    structureEntities.map((entity) => [entity._id, entity]),
  );

  const columns = buildInventoryColumns(placeMap, t);

  if (loading) {
    return <Spinner />;
  }

  return (
    <RecordTable.Provider
      columns={columns}
      data={rows}
      className="h-full px-4 pb-4"
      tableId="accounting_inventory_remainder_detail_record_table"
    >
      <RecordTable>
        <RecordTable.Header showColumnSelector />
        <RecordTable.Body>
          <RecordTable.RowList />
        </RecordTable.Body>
      </RecordTable>
    </RecordTable.Provider>
  );
};

export const RemainderDetailSheet = () => {
  const { t } = useTranslation('accounting');
  const [selected, setSelected] = useAtom(selectedRemainderProductAtom);
  const { addSafeRemainder, loading } = useReCalcRemainders();

  const handleReCalc = () => {
    if (!selected) return;
    addSafeRemainder({ variables: { productIds: [selected.productId] } });
  };

  return (
    <Sheet
      open={!!selected}
      onOpenChange={(open) => !open && setSelected(null)}
    >
      <Sheet.View className="sm:max-w-5xl">
        <Sheet.Header>
          <div>
            <Sheet.Title>
              {selected?.productCode && (
                <span className="text-muted-foreground mr-2 font-normal">
                  {selected.productCode}
                </span>
              )}
              {selected?.productName}
            </Sheet.Title>
          </div>
          <Sheet.Close />
        </Sheet.Header>
        <Sheet.Content className="overflow-hidden">
          <ScrollArea className="h-full">
            {selected && (
              <InventoriesTable inventories={selected.inventories} />
            )}
          </ScrollArea>
        </Sheet.Content>
        <Sheet.Footer className="flex justify-end px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={handleReCalc} disabled={loading}>
            {loading ? (
              <>
                <Spinner />
                {t('running')}
              </>
            ) : (
              <>
                <IconRefresh size={16} />
                {t('recalc-remainder')}
              </>
            )}
          </Button>
        </Sheet.Footer>
      </Sheet.View>
    </Sheet>
  );
};
