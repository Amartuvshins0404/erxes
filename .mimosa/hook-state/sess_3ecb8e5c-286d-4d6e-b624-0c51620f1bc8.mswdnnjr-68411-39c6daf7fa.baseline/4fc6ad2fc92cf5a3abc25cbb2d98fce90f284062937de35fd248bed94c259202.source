import { RecordTable } from 'erxes-ui';
import { SUPPLIERS_CURSOR_SESSION_KEY } from '../constants/cursorSessionKey';
import { useSuppliers } from '../hooks/useSuppliers';
import { suppliersColumns } from './SuppliersColumns';

export const SuppliersTable = () => {
  const { suppliers, loading, pageInfo, handleFetchMore } = useSuppliers();
  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  return (
    <RecordTable.Provider
      columns={suppliersColumns}
      data={suppliers || []}
      stickyColumns={['checkbox', 'avatar', 'name']}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={suppliers?.length}
        sessionKey={SUPPLIERS_CURSOR_SESSION_KEY}
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
