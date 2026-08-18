import { InfoCard } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { GrantSheetState } from '../../hooks/useGrantSheetState';
import { formatMoney } from '../../utils/grantHelpers';
import { CustomerName } from './CustomerName';
import { Row } from './Row';

export const InvoiceCard = ({
  customerId,
  amount,
  selectedPlan,
  selectedPayment,
}: Pick<
  GrantSheetState,
  'customerId' | 'amount' | 'selectedPlan' | 'selectedPayment'
>) => {
  const { t } = useTranslation('mushop');

  if (!selectedPlan || !selectedPayment) return null;

  return (
    <InfoCard title={t('Invoice')} className="flex-1">
      <InfoCard.Content>
        <div className="flex flex-col text-sm">
          <Row label={t('Description')}>{selectedPlan.name}</Row>
          <Row label={t('Customer')}>
            {customerId ? (
              <CustomerName customerId={customerId} />
            ) : (
              '—'
            )}
          </Row>
          <Row label={t('Content')}>
            <span className="font-mono text-sm">mushop:membership</span>
          </Row>
          <Row label={t('Payment')}>
            {selectedPayment.name}
            <span className="ml-1 text-muted-foreground text-sm">
              ({selectedPayment.kind})
            </span>
          </Row>
          <Row label={t('Amount')}>
            <span className="font-semibold">
              {formatMoney(
                amount === '' ? selectedPlan.price : Number(amount),
                selectedPlan.currency,
              )}
            </span>
          </Row>
          <Row label={t('Status')}>
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 px-2 py-0.5 rounded-full font-medium text-emerald-700 text-sm">
              <span className="bg-emerald-500 rounded-full w-1.5 h-1.5" />
              {t('paid')}
            </span>
          </Row>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};
