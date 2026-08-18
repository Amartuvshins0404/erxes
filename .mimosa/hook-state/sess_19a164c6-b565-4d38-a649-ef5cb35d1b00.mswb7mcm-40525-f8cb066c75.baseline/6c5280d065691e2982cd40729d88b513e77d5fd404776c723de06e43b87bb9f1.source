import { offersColumns } from '@/offer/components/OffersColumn';
import { useOffersList, OFFERS_CURSOR_SESSION_KEY } from '@/offer/hooks/useGetOffersList';
import { offerTotalCountAtom } from '@/offer/states/offersTotalCountState';
import { isUndefinedOrNull, RecordTable } from 'erxes-ui';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

export const OffersRecordTable = ({ unitId }: { unitId?: string } = {}) => {
  const setOfferTotalCount = useSetAtom(offerTotalCountAtom);

  const { offers, handleFetchMore, pageInfo, loading, totalCount } =
    useOffersList(unitId ? { variables: { unit: unitId } } : undefined);

  const { hasPreviousPage, hasNextPage } = pageInfo || {};

  useEffect(() => {
    if (isUndefinedOrNull(totalCount)) return;
    setOfferTotalCount(totalCount);
  }, [totalCount, setOfferTotalCount]);

  return (
    <div className="flex flex-col overflow-hidden h-full">
      <RecordTable.Provider
        columns={offersColumns()}
        data={offers || (loading ? [{}] : [])}
        className="m-3 h-full"
        stickyColumns={['checkbox', 'number']}
        tableId="offers_record_table"
      >
        <RecordTable.CursorProvider
          hasPreviousPage={hasPreviousPage}
          hasNextPage={hasNextPage}
          dataLength={offers?.length}
          sessionKey={OFFERS_CURSOR_SESSION_KEY}
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
