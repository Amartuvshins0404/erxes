import { InfoCard, Input, Label, Select } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { GrantSheetState } from '../../hooks/useGrantSheetState';

export const PaymentForm = ({
  paymentMethod,
  setPaymentMethod,
  amount,
  setAmount,
  paymentMethods,
  paymentsLoading,
  selectedPlan,
}: Pick<
  GrantSheetState,
  | 'paymentMethod'
  | 'setPaymentMethod'
  | 'amount'
  | 'setAmount'
  | 'paymentMethods'
  | 'paymentsLoading'
  | 'selectedPlan'
>) => {
  const { t } = useTranslation('mushop');
  return (
    <InfoCard title={t('Payment')}>
      <InfoCard.Content className="gap-4">
        <div className="space-y-1.5">
          <Label className="font-medium text-sm">{t('Method')}</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <Select.Trigger className="w-full">
              <Select.Value
                placeholder={
                  paymentsLoading
                    ? t('Loading…')
                    : paymentMethods.length === 0
                    ? t('No payment methods configured')
                    : t('Select a method')
                }
              />
            </Select.Trigger>
            <Select.Content>
              {paymentMethods.map((m) => (
                <Select.Item key={m._id} value={m._id}>
                  {m.name}
                  <span className="ml-2 text-muted-foreground text-sm">
                    ({m.kind})
                  </span>
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="font-medium text-sm">{t('Amount')}</Label>
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={
              selectedPlan
                ? String(selectedPlan.price)
                : t('Enter amount received')
            }
          />
        </div>
      </InfoCard.Content>
    </InfoCard>
  );
};
