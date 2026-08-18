import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { ColumnDef, Cell } from '@tanstack/table-core';
import {
  Button,
  Input,
  RecordTable,
  RecordTableInlineCell,
  useQueryState,
} from 'erxes-ui';
import { ONE_FIT_ACCOUNT_STATEMENT } from '../graphql/accountStatementQueries';
import { SelectProviderSearchable } from './SelectProviderSearchable';
import { getLocalizedString } from '~/modules/activity-type/utils/localization';
import { FilterField } from '~/components/shared/FilterField';
import { useOneFitMode } from '~/modules/config/hooks/useOneFitMode';

function startOfMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function endOfMonth(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface AccountStatementRow {
  year: number;
  month: number;
  providerId: string;
  provider?: {
    _id: string;
    businessName?: { en?: string; mn?: string };
  } | null;
  creditsEarnedCompleted: number;
  creditsEarnedNoShow: number;
  bookingCountCompleted: number;
  bookingCountNoShow: number;
  amountEarnedCompleted: number;
  amountEarnedNoShow: number;
}

export function AccountStatementReport() {
  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(startOfMonth(now));
  const [endDate, setEndDate] = useState(endOfMonth(now));
  const [providerId, setProviderId] = useState<string>('');

  const [, setAccountStatementId] = useQueryState<string>('accountStatementId');
  const { mode } = useOneFitMode();
  const isMasterMode = mode === 'master';
  const { data, loading } = useQuery(ONE_FIT_ACCOUNT_STATEMENT, {
    variables: {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      providerId: providerId || undefined,
    },
    skip: !startDate || !endDate,
  });
  const result = data?.oneFitAccountStatement;
  const rows: AccountStatementRow[] = result?.rows ?? [];
  const totalCreditsEarned = result?.totalCreditsEarned ?? 0;
  const totalAmountEarned = result?.totalAmountEarned ?? 0;

  const columns: ColumnDef<AccountStatementRow>[] = [
    {
      id: 'rowNumber',
      header: '#',
      size: 48,
      cell: ({ row }: { row: { index: number } }) => (
        <RecordTableInlineCell className="text-xs font-medium text-muted-foreground tabular-nums">
          {row.index + 1}
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'year',
      accessorKey: 'year',
      header: 'Year',
      size: 80,
      cell: ({ cell }: { cell: Cell<AccountStatementRow, unknown> }) => (
        <RecordTableInlineCell className="text-xs font-medium">
          {cell.getValue() as number}
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'month',
      accessorKey: 'month',
      header: 'Month',
      size: 90,
      cell: ({ row }: { row: { original: AccountStatementRow } }) => {
        const y = row.original.year;
        const m = String(row.original.month).padStart(2, '0');
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {y}-{m}
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'provider',
      accessorKey: 'provider',
      header: 'Provider',
      size: 220,
      cell: ({ row }: { row: { original: AccountStatementRow } }) => {
        const provider = row.original.provider;
        const name = provider?.businessName
          ? getLocalizedString(provider.businessName, 'en')
          : row.original.providerId || '-';
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {name}
          </RecordTableInlineCell>
        );
      },
    },
    ...(isMasterMode
      ? [
          {
            id: 'creditsEarnedCompleted',
            accessorKey: 'creditsEarnedCompleted',
            header: 'Credits (completed)',
            size: 180,
            cell: ({ cell }: { cell: Cell<AccountStatementRow, unknown> }) => (
              <RecordTableInlineCell className="text-xs font-medium">
                {(cell.getValue() as number).toFixed(2)}
              </RecordTableInlineCell>
            ),
          },
          {
            id: 'creditsEarnedNoShow',
            accessorKey: 'creditsEarnedNoShow',
            header: 'Credits (no-show)',
            size: 180,
            cell: ({ cell }: { cell: Cell<AccountStatementRow, unknown> }) => (
              <RecordTableInlineCell className="text-xs font-medium">
                {(cell.getValue() as number).toFixed(2)}
              </RecordTableInlineCell>
            ),
          },
        ]
      : []),
    {
      id: 'bookingCountCompleted',
      accessorKey: 'bookingCountCompleted',
      header: 'Bookings (completed)',
      size: 50,
      cell: ({ cell }: { cell: Cell<AccountStatementRow, unknown> }) => (
        <RecordTableInlineCell className="text-xs font-medium">
          {cell.getValue() as number}
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'bookingCountNoShow',
      accessorKey: 'bookingCountNoShow',
      header: 'Bookings (no-show)',
      size: 50,
      cell: ({ cell }: { cell: Cell<AccountStatementRow, unknown> }) => (
        <RecordTableInlineCell className="text-xs font-medium">
          {cell.getValue() as number}
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'amountEarnedCompleted',
      accessorKey: 'amountEarnedCompleted',
      header: 'Amount (completed)',
      size: 200,
      cell: ({ cell }: { cell: Cell<AccountStatementRow, unknown> }) => (
        <RecordTableInlineCell className="text-xs font-medium">
          {(cell.getValue() as number).toFixed(2)}
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'amountEarnedNoShow',
      accessorKey: 'amountEarnedNoShow',
      header: 'Amount (no-show)',
      size: 200,
      cell: ({ cell }: { cell: Cell<AccountStatementRow, unknown> }) => (
        <RecordTableInlineCell className="text-xs font-medium">
          {(cell.getValue() as number).toFixed(2)}
        </RecordTableInlineCell>
      ),
    },
    {
      id: 'details',
      header: '',
      size: 160,
      cell: ({ row }: { row: { original: AccountStatementRow } }) => (
        <RecordTableInlineCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                const encodedData = encodeURIComponent(
                  JSON.stringify(row.original),
                );
                setAccountStatementId(encodedData);
              } catch {
                // ignore invalid row payload
              }
            }}
          >
            View bookings
          </Button>
        </RecordTableInlineCell>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <FilterField label="Start date">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value || '')}
          />
        </FilterField>
        <FilterField label="End date">
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value || '')}
          />
        </FilterField>
        <FilterField label="Provider" optional>
          <SelectProviderSearchable
            value={providerId}
            onValueChange={(value) => setProviderId(value ?? '')}
            className="min-w-[200px]"
          />
        </FilterField>
      </div>

      <div className="rounded-md border flex flex-col max-h-[70vh]">
        <div className="overflow-x-auto overflow-y-auto min-h-0 flex-1">
          <RecordTable.Provider
            columns={columns}
            data={rows}
            className="m-0 overflow-x-auto"
          >
            <RecordTable>
              <RecordTable.Header />
              <RecordTable.Body>
                {loading && <RecordTable.RowSkeleton rows={10} />}
                {!loading && <RecordTable.RowList />}
              </RecordTable.Body>
            </RecordTable>
          </RecordTable.Provider>
        </div>
        {!loading && rows.length > 0 && (
          <div className="border-t bg-muted/30 px-4 py-2 text-sm font-medium space-y-1 shrink-0">
            {isMasterMode && (
              <div>Total credits earned: {totalCreditsEarned.toFixed(2)}</div>
            )}
            <div>Total amount earned: {totalAmountEarned.toFixed(2)}</div>
          </div>
        )}
      </div>

      {!loading && rows.length === 0 && startDate && endDate && (
        <p className="text-sm text-muted-foreground">
          No completed or no-show bookings in the selected date range.
        </p>
      )}
    </div>
  );
}
