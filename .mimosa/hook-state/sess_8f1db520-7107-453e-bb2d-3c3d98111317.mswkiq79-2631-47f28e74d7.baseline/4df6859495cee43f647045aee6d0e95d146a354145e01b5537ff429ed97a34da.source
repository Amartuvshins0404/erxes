import { InfoCard, Label, formatAmount, CurrencyDisplay } from 'erxes-ui';
import { useAdminListingDetail } from '../hooks/useAdminListingDetail';

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label className="text-muted-foreground text-xs">{label}</Label>
    <div className="text-sm font-medium">{children}</div>
  </div>
);

const PRICE_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  negotiable: 'Negotiable',
  onRequest: 'On Request',
};

export const AdminListingDetailPricing = () => {
  const { listing } = useAdminListingDetail();
  const pricing = listing?.pricing;

  return (
    <div className="flex flex-col gap-6 p-8">
      <InfoCard title="Pricing">
        <InfoCard.Content className="grid grid-cols-3 gap-6">
          <Field label="Amount">
            {pricing?.amount ? (
              <span className="flex items-center gap-1">
                <CurrencyDisplay variant="code" code={pricing.currency} />
                {formatAmount(pricing.amount, 'finance')}
              </span>
            ) : (
              '—'
            )}
          </Field>
          <Field label="Currency">{pricing?.currency || '—'}</Field>
          <Field label="Price Type">
            {pricing?.priceType
              ? (PRICE_TYPE_LABELS[pricing.priceType] ?? pricing.priceType)
              : '—'}
          </Field>
        </InfoCard.Content>
      </InfoCard>
    </div>
  );
};
