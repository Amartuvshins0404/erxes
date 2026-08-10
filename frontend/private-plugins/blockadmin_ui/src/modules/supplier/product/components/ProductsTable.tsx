import { RecordTable } from 'erxes-ui';
import { useBaProducts } from '../hooks/useBaProducts';
import { productColumns } from './ProductColumns';

const PRODUCTS_CURSOR_SESSION_KEY = 'blockadmin-products-cursor';

export const ProductsTable = () => {
  const { products, loading, pageInfo, handleFetchMore } = useBaProducts();
  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  return (
    <RecordTable.Provider
      columns={productColumns}
      data={products || []}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={products?.length}
        sessionKey={PRODUCTS_CURSOR_SESSION_KEY}
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
