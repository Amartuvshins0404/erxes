import { contractsColumns } from '@/contract/components/ContractsColumn';
import { isUndefinedOrNull, RecordTable } from 'erxes-ui';
import {
  useContractsList,
  CONTRACTS_CURSOR_SESSION_KEY,
} from '@/contract/hooks/useGetContractsList';
import { useBlockContractStatusesByType } from '@/contract-status/hooks/useGetBlockContractStatuses';
import { useSetAtom } from 'jotai';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { contractTotalCountAtom } from '@/contract/states/contractsTotalCountState';

export const ContractsRecordTable = ({ unitId }: { unitId?: string } = {}) => {
  const { projectId: projectIdParam, id } = useParams<{
    projectId?: string;
    id?: string;
  }>();
  const projectId = projectIdParam || id || '';
  const setContractTotalCount = useSetAtom(contractTotalCountAtom);

  const { contracts, handleFetchMore, pageInfo, loading, totalCount } =
    useContractsList(unitId ? { variables: { unit: unitId } } : undefined);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  useEffect(() => {
    if (isUndefinedOrNull(totalCount)) return;
    setContractTotalCount(totalCount);
  }, [totalCount, setContractTotalCount]);

  const { statuses } = useBlockContractStatusesByType({ projectId });

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <RecordTable.Provider
        columns={contractsColumns(statuses || [])}
        data={contracts || (loading ? [{}] : [])}
        className="m-3 h-full"
        stickyColumns={['checkbox', 'number']}
        tableId="contracts_record_table"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={contracts?.length}
          sessionKey={CONTRACTS_CURSOR_SESSION_KEY}
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
    </div>
  );
};
