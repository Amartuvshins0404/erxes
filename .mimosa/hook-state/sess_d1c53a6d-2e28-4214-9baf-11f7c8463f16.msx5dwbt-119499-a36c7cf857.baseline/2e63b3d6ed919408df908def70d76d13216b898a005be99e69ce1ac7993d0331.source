import { useCustomerInline } from 'ui-modules';
import { useTranslation } from 'react-i18next';

export const CustomerName = ({ customerId }: { customerId: string }) => {
  const { t } = useTranslation('mushop');
  const { customer, loading } = useCustomerInline({
    variables: { _id: customerId },
    skip: !customerId,
  });

  if (loading) return <span className="text-muted-foreground">…</span>;
  if (!customer) return <span>—</span>;

  const { firstName, lastName, primaryEmail, primaryPhone } = customer;
  const fullName =
    firstName || lastName
      ? `${firstName || ''} ${lastName || ''}`.trim()
      : primaryEmail || primaryPhone || t('Unnamed customer');

  return <span>{fullName}</span>;
};
