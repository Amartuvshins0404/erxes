import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/table-core';
import {
  Badge,
  Button,
  RecordTable,
  RecordTableInlineCell,
  RelativeDateDisplay,
} from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { useCreditTransactions } from '../hooks/useCreditTransactions';
import { CreditTransactionFilters } from '../types/credit';
import { CREDIT_TRANSACTIONS_CURSOR_SESSION_KEY } from '../constants/creditTransactionCursorSessionKey';
import { RemoveCreditTransactionDialog } from './RemoveCreditTransactionDialog';
import { useState } from 'react';
import {
  OneFitCreditTransactionType,
  OneFitCreditSource,
} from '../types/credit';
import { OneFitCustomersInline } from '~/modules/onefitCustomer/components/OneFitCustomersInline';
import { GET_COMPANIES_BY_IDS } from '../graphql/companyQueries';
import { ListTotalsLabel } from '~/components/ListTotalsLabel';

interface CreditTransactionsListProps {
  filters?: CreditTransactionFilters;
}

const getTransactionTypeBadgeVariant = (type: OneFitCreditTransactionType) => {
  switch (type) {
    case OneFitCreditTransactionType.PURCHASE:
      return 'success';
    case OneFitCreditTransactionType.USAGE:
      return 'default';
    case OneFitCreditTransactionType.REFUND:
      return 'info';
    case OneFitCreditTransactionType.EXPIRATION:
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getSourceBadgeVariant = (source: OneFitCreditSource) => {
  switch (source) {
    case OneFitCreditSource.INDIVIDUAL:
      return 'default';
    case OneFitCreditSource.CORPORATE:
      return 'info';
    default:
      return 'secondary';
  }
};

export const CreditTransactionsList = ({
  filters,
}: CreditTransactionsListProps) => {
  const {
    creditTransactions,
    handleFetchMore,
    loading,
    pageInfo,
    filteredTotalCount,
    overallTotalCount,
  } = useCreditTransactions(filters);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    [],
  );
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const companyIds = useMemo(
    () =>
      Array.from(
        new Set(
          (creditTransactions ?? [])
            .map((t) => t.companyId)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [creditTransactions],
  );

  const { data: companiesData } = useQuery(GET_COMPANIES_BY_IDS, {
    variables: { ids: companyIds },
    skip: companyIds.length === 0,
  });

  const companyNameById = useMemo(() => {
    const list = companiesData?.companies?.list ?? [];
    return new Map(list.map((c) => [c._id, c.primaryName ?? c._id]));
  }, [companiesData]);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  const columns: ColumnDef<any>[] = [
    // {
    //   accessorKey: '_id',
    //   header: 'ID',
    //   cell: ({ cell }) => {
    //     return (
    //       <RecordTableInlineCell className="text-xs font-medium">
    //         {(cell.getValue() as string).slice(0, 8)}...
    //       </RecordTableInlineCell>
    //     );
    //   },
    // },
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const transaction = row.original;
        const user = transaction.user;
        if (!user) {
          return (
            <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
              -
            </RecordTableInlineCell>
          );
        }
        return (
          <RecordTableInlineCell>
            <OneFitCustomersInline
              customers={[
                {
                  _id: user._id,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  primaryEmail: user.primaryEmail,
                  primaryPhone: user.primaryPhone,
                },
              ]}
              placeholder="Unnamed user"
            />
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
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ cell }) => {
        const amount = cell.getValue() as number;
        const isPositive = amount > 0;
        return (
          <RecordTableInlineCell
            className={`text-xs font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isPositive ? '+' : ''}
            {amount.toFixed(2)}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'transactionType',
      header: 'Type',
      cell: ({ cell }) => {
        const type = cell.getValue() as OneFitCreditTransactionType;
        return (
          <RecordTableInlineCell>
            <Badge variant={getTransactionTypeBadgeVariant(type)}>
              {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'source',
      header: 'Source',
      cell: ({ cell }) => {
        const source = cell.getValue() as OneFitCreditSource;
        return (
          <RecordTableInlineCell>
            <Badge variant={getSourceBadgeVariant(source)}>
              {source.charAt(0).toUpperCase() + source.slice(1)}
            </Badge>
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'companyId',
      header: 'Company',
      cell: ({ row }) => {
        const transaction = row.original;
        const companyId = transaction.companyId;
        if (!companyId) {
          return (
            <RecordTableInlineCell className="text-xs text-muted-foreground">
              —
            </RecordTableInlineCell>
          );
        }
        const name = companyNameById.get(companyId);
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {name ?? companyId}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium text-muted-foreground">
            {cell.getValue() as string}
          </RecordTableInlineCell>
        );
      },
    },
    {
      accessorKey: 'balanceAfter',
      header: 'Balance After',
      cell: ({ cell }) => {
        return (
          <RecordTableInlineCell className="text-xs font-medium">
            {(cell.getValue() as number).toFixed(2)}
          </RecordTableInlineCell>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const transaction = row.original;

        return (
          <RecordTableInlineCell>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTransactions([transaction._id]);
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
        data={creditTransactions || []}
        className="m-3"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={creditTransactions?.length}
          sessionKey={CREDIT_TRANSACTIONS_CURSOR_SESSION_KEY}
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

      {selectedTransactions.length > 0 && (
        <RemoveCreditTransactionDialog
          transactionIds={selectedTransactions}
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          onClose={() => {
            setRemoveDialogOpen(false);
            setSelectedTransactions([]);
          }}
        />
      )}
    </>
  );
};
