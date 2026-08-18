import { RecordTable } from 'erxes-ui';
import { useMembers } from '../hooks/useMembers';
import { membersColumns } from './MembersColumns';

const MEMBERS_CURSOR_SESSION_KEY = 'mushop-members-cursor';

export const MembersTable = () => {
  const { members, loading, pageInfo, handleFetchMore } = useMembers();
  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  return (
    <RecordTable.Provider
      columns={membersColumns}
      data={members || []}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={members?.length}
        sessionKey={MEMBERS_CURSOR_SESSION_KEY}
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
