import { RecordTable } from 'erxes-ui';
import { useCollectives } from '../hooks/useCollectives';
import { collectivesColumns } from './CollectivesColumns';

const COLLECTIVES_CURSOR_SESSION_KEY = 'mushop-collectives-cursor';

export const CollectivesTable = () => {
  const { collectives, loading, pageInfo, handleFetchMore } = useCollectives();
  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  return (
    <RecordTable.Provider
      columns={collectivesColumns}
      data={collectives || []}
      stickyColumns={['checkbox', 'name']}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={collectives?.length}
        sessionKey={COLLECTIVES_CURSOR_SESSION_KEY}
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
