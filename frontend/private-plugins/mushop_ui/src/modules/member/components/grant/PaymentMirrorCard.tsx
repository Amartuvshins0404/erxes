import { IconBuildingBank } from '@tabler/icons-react';
import { InfoCard } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { KHANBANK_DEPOSIT_ACCOUNT } from '../../constants';
import { GrantSheetState } from '../../hooks/useGrantSheetState';
import { formatMoney } from '../../utils/grantHelpers';
import { Row } from './Row';

export const PaymentMirrorCard = ({
  customerId,
  amount,
  selectedPlan,
  selectedPayment,
  isKhanbank,
}: Pick<
  GrantSheetState,
  | 'customerId'
  | 'amount'
  | 'selectedPlan'
  | 'selectedPayment'
  | 'isKhanbank'
>) => {
  const { t } = useTranslation('mushop');

  if (!selectedPlan || !selectedPayment) return null;

  return (
    <InfoCard title={t('Payment')}>
      <InfoCard.Content>
        <div className="flex flex-col text-sm">
          <Row label={t('Method')}>
            <span className="inline-flex items-center gap-1.5">
              {selectedPayment.name}
              <span className="text-muted-foreground text-sm">
                ({selectedPayment.kind})
              </span>
            </span>
          </Row>
          <Row label={t('Amount')}>
            <span className="font-semibold text-primary">
              {formatMoney(
                amount === '' ? selectedPlan.price : Number(amount),
                selectedPlan.currency,
              )}
            </span>
          </Row>
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};
