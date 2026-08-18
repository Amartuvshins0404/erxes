import { InfoCard, Label } from 'erxes-ui';
import { useAdminListingDetail } from '../hooks/useAdminListingDetail';

const Field = ({
  label,
  value,
  unit,
}: {
  label: string;
  value?: string | number | null;
  unit?: string;
}) => (
  <div className="space-y-1.5">
    <Label className="text-muted-foreground text-xs">{label}</Label>
    <p className="text-sm font-medium">
      {value === undefined || value === null || value === ''
        ? '—'
        : `${value}${unit ? ` ${unit}` : ''}`}
    </p>
  </div>
);

export const AdminListingDetailSpecs = () => {
  const { listing } = useAdminListingDetail();
  const specs = listing?.specs;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Specifications">
        <InfoCard.Content className="grid grid-cols-3 gap-6">
          <Field label="Area" value={specs?.area} unit="m²" />
          <Field label="Floor" value={specs?.floor} />
          <Field label="Total Floors" value={specs?.totalFloors} />
          <Field label="Rooms" value={specs?.rooms} />
          <Field label="Built Year" value={specs?.builtYear} />
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
