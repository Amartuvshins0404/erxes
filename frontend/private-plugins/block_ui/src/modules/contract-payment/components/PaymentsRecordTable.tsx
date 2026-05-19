import { EnumCursorDirection, RecordTable, Spinner } from 'erxes-ui';
import { paymentsColumns, PaymentsColumnOptions } from './PaymentsColumns';
import { IContractPayment } from '@/contract-payment/types';
import { useMemo, useRef } from 'react';

export interface IPaymentsPageInfo {
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

const sortPayments = (payments: IContractPayment[]) => {
  const now = Date.now();
  const due = (p: IContractPayment) => {
    const t = p.dueDate ? Number(new Date(p.dueDate)) : 0;
    return Number.isFinite(t) ? t : 0;
  };
  return [...payments].sort((a, b) => {
    // unpaid first, paid last
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    // among unpaid: earliest due first (overdue floats up naturally)
    // among paid: by paidDate desc (most recent paid first)
    if (!a.paid) return due(a) - due(b);
    const ap = a.paidDate ? Number(new Date(a.paidDate)) : 0;
    const bp = b.paidDate ? Number(new Date(b.paidDate)) : 0;
    return bp - ap;
  });
};

export const PaymentsRecordTable = ({
  payments,
  loading,
  className,
  showContract = false,
  showCustomer = false,
  showUnit = false,
  tableId = 'contract_payments_record_table',
  pageInfo,
  handleFetchMore,
  cursorSessionKey,
}: {
  payments: IContractPayment[];
  loading?: boolean;
  className?: string;
  tableId?: string;
  pageInfo?: IPaymentsPageInfo;
  handleFetchMore?: (args: { direction: EnumCursorDirection }) => void;
  cursorSessionKey?: string;
} & PaymentsColumnOptions) => {
  const columns = useMemo(
    () => paymentsColumns({ showContract, showCustomer, showUnit }),
    [showContract, showCustomer, showUnit],
  );

  // Stable order: lock the order based on the initial snapshot for a given
  // set of payment IDs. When a payment's `paid` flag toggles, the row keeps
  // its place — only adding/removing rows triggers a re-sort. This matches
  // the operation task table behaviour.
  const lockedOrderRef = useRef<{ key: string; ids: string[] }>({
    key: '',
    ids: [],
  });

  const sorted = useMemo(() => {
    const idsKey = payments
      .map((p) => p._id)
      .sort()
      .join(',');
    if (lockedOrderRef.current.key !== idsKey) {
      lockedOrderRef.current = {
        key: idsKey,
        ids: sortPayments(payments).map((p) => p._id),
      };
    }
    const byId = new Map(payments.map((p) => [p._id, p]));
    return lockedOrderRef.current.ids
      .map((id) => byId.get(id))
      .filter(Boolean) as IContractPayment[];
  }, [payments]);

  return (
    <div className={`flex flex-col overflow-hidden h-full ${className || ''}`}>
      <RecordTable.Provider
        columns={columns}
        data={sorted.length ? sorted : loading ? [{} as IContractPayment] : []}
        className="m-3 h-full"
        stickyColumns={['status']}
        tableId={tableId}
      >
        {handleFetchMore ? (
          <RecordTable.CursorProvider
            hasPreviousPage={!!pageInfo?.hasPreviousPage}
            hasNextPage={!!pageInfo?.hasNextPage}
            dataLength={sorted.length}
            sessionKey={cursorSessionKey || tableId}
          >
            <RecordTable>
              <RecordTable.Header />
              <RecordTable.Body>
                <RecordTable.CursorBackwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
                {loading && <RecordTable.RowSkeleton rows={20} />}
                <RecordTable.RowList />
                <RecordTable.CursorForwardSkeleton
                  handleFetchMore={handleFetchMore}
                />
              </RecordTable.Body>
            </RecordTable>
          </RecordTable.CursorProvider>
        ) : (
          <RecordTable>
            <RecordTable.Header />
            <RecordTable.Body>
              {loading && <RecordTable.RowSkeleton rows={10} />}
              <RecordTable.RowList />
            </RecordTable.Body>
          </RecordTable>
        )}
      </RecordTable.Provider>
    </div>
  );
};
