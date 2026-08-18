import { RecordTable } from 'erxes-ui';
import { useMushopProducts } from '../hooks/useMushopProducts';
import { productColumns } from './ProductColumns';
import { ProductsCommandBar } from './ProductsCommandBar';

const PRODUCTS_CURSOR_SESSION_KEY = 'mushop-products-cursor';

export const ProductsTable = () => {
  const { products, loading, pageInfo, handleFetchMore } = useMushopProducts();
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
      <ProductsCommandBar />
    </RecordTable.Provider>
  );
};
