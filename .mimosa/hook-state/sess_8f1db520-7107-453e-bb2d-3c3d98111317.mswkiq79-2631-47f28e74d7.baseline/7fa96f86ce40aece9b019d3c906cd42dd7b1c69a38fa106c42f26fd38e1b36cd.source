import { InfoCard, Label } from 'erxes-ui';
import { useAdminListingDetail } from '../hooks/useAdminListingDetail';

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) => (
  <div className="space-y-1.5">
    <Label className="text-muted-foreground text-xs">{label}</Label>
    <p className="text-sm font-medium">
      {value === undefined || value === null || value === ''
        ? '—'
        : String(value)}
    </p>
  </div>
);

export const AdminListingDetailGeneral = () => {
  const { listing } = useAdminListingDetail();

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Basic Information">
        <InfoCard.Content className="grid grid-cols-3 gap-6">
          <Field label="Title" value={listing?.title} />
          <Field label="Type" value={listing?.type} />
          <Field label="Property Type" value={listing?.propertyType} />
          <Field label="Status" value={listing?.status} />
          <Field label="Featured" value={listing?.isFeatured ? 'Yes' : 'No'} />
          <Field label="View Count" value={listing?.viewCount} />
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title="Description">
        <InfoCard.Content>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {listing?.description || '—'}
          </p>
        </InfoCard.Content>
      </InfoCard>

      <InfoCard title="System">
        <InfoCard.Content className="grid grid-cols-2 gap-6">
          <Field label="ID" value={listing?._id} />
          <Field label="Entity ID" value={listing?.entityId} />
          <Field label="Subdomain" value={listing?.subdomain} />
          <Field
            label="Created At"
            value={
              listing?.createdAt
                ? new Date(listing.createdAt).toLocaleString()
                : undefined
            }
          />
          <Field
            label="Updated At"
            value={
              listing?.updatedAt
                ? new Date(listing.updatedAt).toLocaleString()
                : undefined
            }
          />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
