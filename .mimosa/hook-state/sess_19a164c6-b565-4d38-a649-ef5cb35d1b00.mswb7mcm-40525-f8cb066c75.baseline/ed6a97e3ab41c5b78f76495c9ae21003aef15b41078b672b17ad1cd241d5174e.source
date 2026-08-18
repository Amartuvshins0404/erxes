import { InfoCard, Label } from 'erxes-ui';
import { useAdminListingDetail } from '../hooks/useAdminListingDetail';

const Field = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
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

export const AdminListingDetailLocation = () => {
  const { listing } = useAdminListingDetail();
  const loc = listing?.location;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Location">
        <InfoCard.Content className="grid grid-cols-3 gap-6">
          <Field label="City" value={loc?.city} />
          <Field label="District" value={loc?.district} />
          <Field label="Sub-District" value={loc?.subDistrict} />
          <Field label="Short Address" value={loc?.short} />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
