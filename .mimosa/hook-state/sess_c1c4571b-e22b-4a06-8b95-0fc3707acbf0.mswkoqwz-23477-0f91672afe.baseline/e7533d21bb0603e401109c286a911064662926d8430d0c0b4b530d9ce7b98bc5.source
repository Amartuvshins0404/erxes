import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from 'erxes-ui';
import { IconBuilding } from '@tabler/icons-react';
import { CreditTransactionsList } from '~/modules/credit/components/CreditTransactionsList';
import { CreditTransactionFiltersComponent } from '~/modules/credit/components/CreditTransactionFilters';
import { CreateCreditTransactionDialog } from '~/modules/credit/components/CreateCreditTransactionDialog';
import { BulkCreditTransactionDialog } from '~/modules/credit/components/BulkCreditTransactionDialog';
import {
  CreditTransactionFilters,
  OneFitCreditSource,
  OneFitCreditTransactionType,
} from '~/modules/credit/types/credit';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';

const CREDIT_TX_URL_KEYS = [
  'userId',
  'transactionType',
  'source',
  'bookingId',
] as const;

const CREDIT_TRANSACTION_TYPE_VALUES = new Set(
  Object.values(OneFitCreditTransactionType),
);
const CREDIT_SOURCE_VALUES = new Set(Object.values(OneFitCreditSource));

function parseCreditTransactionFiltersFromSearchParams(
  searchParams: URLSearchParams,
): CreditTransactionFilters {
  const userId = searchParams.get('userId')?.trim() || undefined;
  const bookingId = searchParams.get('bookingId')?.trim() || undefined;
  const transactionTypeRaw = searchParams.get('transactionType');
  const transactionType =
    transactionTypeRaw &&
    CREDIT_TRANSACTION_TYPE_VALUES.has(
      transactionTypeRaw as OneFitCreditTransactionType,
    )
      ? (transactionTypeRaw as OneFitCreditTransactionType)
      : undefined;
  const sourceRaw = searchParams.get('source');
  const source =
    sourceRaw && CREDIT_SOURCE_VALUES.has(sourceRaw as OneFitCreditSource)
      ? (sourceRaw as OneFitCreditSource)
      : undefined;

  return { userId, transactionType, source, bookingId };
}

function applyCreditTransactionFiltersToSearchParams(
  filters: CreditTransactionFilters,
  prev: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(prev);
  for (const key of CREDIT_TX_URL_KEYS) {
    next.delete(key);
  }
  if (filters.userId) next.set('userId', filters.userId);
  if (filters.transactionType)
    next.set('transactionType', filters.transactionType);
  if (filters.source) next.set('source', filters.source);
  if (filters.bookingId) next.set('bookingId', filters.bookingId);
  return next;
}

export function CreditTransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => parseCreditTransactionFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const onFiltersChange = useCallback(
    (nextFilters: CreditTransactionFilters) => {
      setSearchParams(
        (prev) =>
          applyCreditTransactionFiltersToSearchParams(nextFilters, prev),
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return (
    <OneFitListPageLayout
      pageName="Credit Transactions"
      filters={filters}
      onFiltersChange={onFiltersChange}
      filtersComponent={CreditTransactionFiltersComponent}
      createDialog={<CreateCreditTransactionDialog />}
      createDialogInHeader={true}
      headerActions={
        <BulkCreditTransactionDialog
          trigger={
            <Button variant="outline" size="sm" disabled>
              <IconBuilding />
              Bulk credit (corporate)
            </Button>
          }
        />
      }
      listComponent={CreditTransactionsList}
    />
  );
}
