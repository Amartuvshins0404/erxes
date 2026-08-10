import { useCustomerDetail } from 'ui-modules';
import { InfoCard, Label, Skeleton } from 'erxes-ui';

export const UnitPartyDetail = ({
  customerId,
}: {
  customerId?: string | null;
}) => {
  const { customerDetail, loading } = useCustomerDetail(
    { variables: { _id: customerId }, skip: !customerId },
    true,
  );

  if (!customerId) return null;

  const field = (label: string, value?: string | null) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="font-medium">
        {loading ? <Skeleton className="h-5 w-24" /> : value || '—'}
      </div>
    </div>
  );

  return (
    <InfoCard title="Customer">
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
