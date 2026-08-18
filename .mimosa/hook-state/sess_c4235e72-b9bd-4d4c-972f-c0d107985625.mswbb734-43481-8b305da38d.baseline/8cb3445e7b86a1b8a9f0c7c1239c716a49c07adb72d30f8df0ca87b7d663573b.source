import { IconStar } from '@tabler/icons-react';
import { Badge, Spinner } from 'erxes-ui';
import { useAdminListingDetail } from '../hooks/useAdminListingDetail';
import { AdminListingDetailActions } from './AdminListingDetailActions';

const STATUS_VARIANT: Record<
  string,
  'success' | 'warning' | 'info' | 'secondary'
> = {
  active: 'success',
  inactive: 'warning',
  sold: 'info',
  draft: 'secondary',
};

const TYPE_LABELS: Record<string, string> = {
  sale: 'Sale',
  rent: 'Rent',
  lease: 'Lease',
};

export const AdminListingDetailProfile = () => {
  const { listing, loading } = useAdminListingDetail();

  if (loading) return <Spinner containerClassName="py-12" />;

  return (
    <div className="flex border-b">
      <div className="p-8 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold">{listing?.title}</h1>
          <Badge variant={STATUS_VARIANT[listing?.status ?? ''] ?? 'secondary'}>
            {listing?.status}
          </Badge>
          <Badge variant="outline">
            {TYPE_LABELS[listing?.type ?? ''] ?? listing?.type}
          </Badge>
          {listing?.isFeatured && (
            <Badge
              variant="warning"
              className="bg-amber-500 text-white border-0"
            >
              <IconStar className="size-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        {listing?.location?.city && (
          <p className="text-sm text-muted-foreground">
            {[listing.location.city, listing.location.district]
              .filter(Boolean)
              .join(', ')}
          </p>
        )}
      </div>
      <div className="ml-auto p-8">
        <AdminListingDetailActions />
      </div>
    </div>
  );
};
