import { Label, RecordTable } from 'erxes-ui';
import { BLOCK_LISTING_CURSOR_SESSION_KEY } from '../constants/listing';
import { listingColumns } from './listingColumns';
import { useGetListings } from '../hooks/useGetListings';
import { ListingFilterValue } from './ListingFilter';

const PER_PAGE = 20;

type Props = {
  filter?: ListingFilterValue;
};

export const ListingRecordTable = ({ filter }: Props) => {
  const { list, loading, totalCount, pageInfo, handleFetchMore } =
    useGetListings({
      variables: {
        limit: PER_PAGE,
        status: filter?.status,
        searchValue: filter?.searchValue,
      },
    });
  const { hasNextPage, hasPreviousPage } = pageInfo || {};

  const RecordMain = () => {
    if (loading) {
      return <RecordTable.RowSkeleton rows={PER_PAGE} />;
    }
    if (!totalCount) {
      return (
        <tr className="h-[40vh]">
          <td colSpan={9} className="py-10 text-center">
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Label>No listings</Label>
            </div>
          </td>
        </tr>
      );
    }
    return <RecordTable.RowList />;
  };

  return (
    <RecordTable.Provider
      columns={listingColumns}
      data={list}
      stickyColumns={['title']}
      className="m-3"
    >
      <RecordTable.CursorProvider
        hasPreviousPage={hasPreviousPage}
        hasNextPage={hasNextPage}
        dataLength={PER_PAGE}
        sessionKey={BLOCK_LISTING_CURSOR_SESSION_KEY}
      >
        <RecordTable>
          <RecordTable.Header />
          <RecordTable.Body>
            <RecordTable.CursorBackwardSkeleton
              handleFetchMore={handleFetchMore}
            />
            <RecordMain />
            <RecordTable.CursorForwardSkeleton
              handleFetchMore={handleFetchMore}
            />
          </RecordTable.Body>
        </RecordTable>
      </RecordTable.CursorProvider>
    </RecordTable.Provider>
  );
};
