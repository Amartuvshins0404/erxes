import { RecordTable } from 'erxes-ui';
import { ORDERS_CURSOR_SESSION_KEY } from '../constants/cursorSessionKey';
import { useOrders } from '../hooks/useOrders';
import { ordersColumns } from './OrdersColumns';

export const OrdersTable = () => {
  const { orders, loading, pageInfo, handleFetchMore } = useOrders();
  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  return (
    <RecordTable.Provider
      columns={ordersColumns}
      data={orders || []}
      stickyColumns={['checkbox', 'entityId']}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={orders?.length}
        sessionKey={ORDERS_CURSOR_SESSION_KEY}
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
    </RecordTable.Provider>
  );
};
