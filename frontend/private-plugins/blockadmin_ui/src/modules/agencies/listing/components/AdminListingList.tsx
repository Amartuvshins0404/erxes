import { Spinner, useMultiQueryState } from 'erxes-ui';
import { useAdminListings } from '../hooks/useAdminListings';
import { AdminListingListItem } from './AdminListingListItem';
import { AdminListingFilter, IAdminListing } from '../types/listingTypes';

export const AdminListingList = () => {
  const [queries] = useMultiQueryState<AdminListingFilter>([
    'searchValue',
    'agencyId',
    'city',
    'district',
    'status',
  ]);
  const { list, loading } = useAdminListings({
    variables: queries,
  });

  if (loading) {
    return <Spinner containerClassName="py-32" />;
  }

  if (!list.length) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-muted-foreground">
        No listings found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 m-3">
      {list.map((listing: IAdminListing) => (
        <AdminListingListItem key={listing._id} {...listing} />
      ))}
    </div>
  );
};
