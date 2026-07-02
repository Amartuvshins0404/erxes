import { useCustomerDetail } from 'ui-modules';
import { InfoCard, Label, Skeleton } from 'erxes-ui';

export const UnitPartyDetail = ({
  partyId,
  partyType,
}: {
  partyId?: string | null;
  partyType?: string | null;
}) => {
  const isCustomer = partyType === 'customer';

  const { customerDetail, loading } = useCustomerDetail(
    { variables: { _id: partyId }, skip: !partyId || !isCustomer },
    true,
  );

  if (!partyId || !partyType) return null;

  const field = (label: string, value?: string | null) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="font-medium">
        {loading ? <Skeleton className="h-5 w-24" /> : value || '—'}
      </div>
    </div>
  );

  return (
    <InfoCard title="Party">
      <InfoCard.Content>
        <div className="gap-4 grid grid-cols-3">
          {field('First Name', customerDetail?.firstName)}
          {field('Last Name', customerDetail?.lastName)}
          {field('Phone', customerDetail?.primaryPhone)}
          {field('Email', customerDetail?.primaryEmail)}
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};
