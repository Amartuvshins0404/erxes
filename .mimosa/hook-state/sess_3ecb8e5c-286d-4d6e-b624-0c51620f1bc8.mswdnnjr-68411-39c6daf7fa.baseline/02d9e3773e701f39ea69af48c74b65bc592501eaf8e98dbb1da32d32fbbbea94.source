import { Spinner, useMultiQueryState } from 'erxes-ui';
import { useAdminListings } from '../hooks/useAdminListings';
import { AdminListingCard } from './AdminListingCard';
import { AdminListingFilter, IAdminListing } from '../types/listingTypes';

export const AdminListingGrid = () => {
  const [queries] = useMultiQueryState<AdminListingFilter>([
    'searchValue',
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
    <div className="grid grid-cols-1 ba:lg:grid-cols-2 ba:xl:grid-cols-3 ba:2xl:grid-cols-4 gap-6 m-3">
      {list.map((listing: IAdminListing) => (
        <AdminListingCard key={listing._id} {...listing} />
      ))}
    </div>
  );
};
