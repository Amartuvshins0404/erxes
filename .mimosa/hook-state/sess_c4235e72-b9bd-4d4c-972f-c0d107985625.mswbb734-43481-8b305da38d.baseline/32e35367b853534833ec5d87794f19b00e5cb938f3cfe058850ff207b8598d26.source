import { ColumnDef } from '@tanstack/table-core';
import {
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useScheduleExceptions } from '../hooks/useScheduleExceptions';
import { ScheduleExceptionFilters } from '../types/schedule';
import { SCHEDULE_EXCEPTIONS_CURSOR_SESSION_KEY } from '../constants/scheduleCursorSessionKey';
import { RemoveScheduleExceptionDialog } from './RemoveDialog';
import { useState } from 'react';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface ScheduleExceptionsListProps {
  filters: ScheduleExceptionFilters;
}

export const ScheduleExceptionsList = ({
  filters,
}: ScheduleExceptionsListProps) => {
  const {
    scheduleExceptions,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useScheduleExceptions(filters);
  const [selectedException, setSelectedException] = useState<string | null>(
    null,
  );
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'provider',
      header: 'Provider',
      cell: ({ row }) => {
        const provider = row.original.provider;
        const providerName =
          provider?.businessName?.en ||
          provider?.businessName?.mn ||
          row.original.providerId ||
          '-';
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {providerName}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ cell }) => {
        const date = cell.getValue() as string;
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {new Date(date).toLocaleDateString()}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'reason',
      header: 'Reason',
      cell: ({ cell }) => {
        const reason = cell.getValue() as string | undefined;
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {reason || '-'}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            <RelativeDateDisplay value={cell.getValue() as string} asChild>
              <RelativeDateDisplay.Value value={cell.getValue() as string} />
            </RelativeDateDisplay>
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const exception = row.original;

        return (
          <RecordTableInlineCell>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedException(exception._id);
                  setRemoveDialogOpen(true);
                }}
              >
                Remove
              </Button>
            </div>
          </RecordTableInlineCell>
        );
      },
    },
  ];

  return (
    <>
      <ListTotalsLabel
        filteredTotalCount={filteredTotalCount}
        overallTotalCount={overallTotalCount}
        loading={loading}
      />
      <RecordTable.Provider
        columns={columns}
        data={scheduleExceptions || []}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={scheduleExceptions?.length}
          sessionKey={SCHEDULE_EXCEPTIONS_CURSOR_SESSION_KEY}
        >
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              <RecordTable.CursorBackwardSkeleton
                handleFetchMore={handleFetchMore}
              />
              {loading && <RecordTable.RowSkeleton rows={40} />}
              <RecordTable.RowList />
              <RecordTable.CursorForwardSkeleton
                handleFetchMore={handleFetchMore}
              />
            </RecordTable.Body>
          </RecordTable>
        </RecordTable.CursorProvider>
      </RecordTable.Provider>

      {selectedException && (
        <RemoveScheduleExceptionDialog
          exceptionId={selectedException}
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          onClose={() => {
            setRemoveDialogOpen(false);
            setSelectedException(null);
          }}
        />
      )}
    </>
  );
};
