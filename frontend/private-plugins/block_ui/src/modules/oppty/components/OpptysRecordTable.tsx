import { opptysColumns } from '@/oppty/components/OpptysColumn';
import { IOppty } from '@/oppty/types/opptyTypes';
import { isUndefinedOrNull, RecordTable } from 'erxes-ui';
import { useOpptys } from '@/oppty/hooks/useGetOpptys';
import { OPPTYS_CURSOR_SESSION_KEY } from '@/oppty/constants/constants';
import { useBlockStatusesByType } from '@/status/hooks/useGetBlockStatuses';
import { useUnitTypes } from '@/unit/hooks/useUnitTypes';
import { useSetAtom } from 'jotai';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { opptyTotalCountAtom } from '@/oppty/states/opptysTotalCountState';

export const OpptysRecordTable = ({
  projectId: projectIdProp,
  unitId,
}: { projectId?: string; unitId?: string } = {}) => {
  const { projectId: projectIdParam } = useParams<{ projectId?: string }>();
  const projectId = projectIdProp || projectIdParam || '';
  const setOpptyTotalCount = useSetAtom(opptyTotalCountAtom);

  const { opptys, loading, pageInfo, totalCount, handleFetchMore } = useOpptys(
    projectId,
    unitId ? { variables: { unit: unitId } } : undefined,
  );

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  useEffect(() => {
    if (isUndefinedOrNull(totalCount)) return;
    setOpptyTotalCount(totalCount);
  }, [totalCount, setOpptyTotalCount]);

  const { statuses } = useBlockStatusesByType({ projectId: projectId || '' });
  const { unitTypes } = useUnitTypes({ project: projectId || '' });

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <RecordTable.Provider
        columns={opptysColumns(statuses || [], unitTypes)}
        data={opptys || (loading ? [{}] : [])}
        className="m-3 h-full"
        stickyColumns={['checkbox', 'number']}
        tableId="opptys_record_table"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={opptys?.length}
          sessionKey={OPPTYS_CURSOR_SESSION_KEY}
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
