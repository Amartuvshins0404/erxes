import { EnumCursorDirection, RecordTable, Spinner } from 'erxes-ui';
import { paymentsColumns, PaymentsColumnOptions } from './PaymentsColumns';
import { IContractPayment } from '@/contract-payment/types';
import { useMemo } from 'react';

export interface IPaymentsPageInfo {
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
  endCursor?: string | null;
}

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

  return (
    <div className={`flex flex-col overflow-hidden h-full ${className || ''}`}>
      <RecordTable.Provider
        columns={columns}
        data={payments.length ? payments : loading ? [{} as IContractPayment] : []}
        className="m-3 h-full"
        stickyColumns={['status']}
        tableId={tableId}
      >
        {handleFetchMore ? (
          <RecordTable.CursorProvider
            hasPreviousPage={!!pageInfo?.hasPreviousPage}
            hasNextPage={!!pageInfo?.hasNextPage}
            dataLength={payments.length}
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
