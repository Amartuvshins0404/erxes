import { Form, InfoCard, Select } from 'erxes-ui';
import { Control, FieldValues, Path } from 'react-hook-form';
import { usePayments } from '../hooks/usePayments';

interface PaymentMethodFieldProps<T extends FieldValues> {
  control: Control<T>;
  className?: string;
}

export const PaymentMethodField = <T extends FieldValues>({
  control,
  className,
}: PaymentMethodFieldProps<T>) => {
  const { payments, loading } = usePayments();

  return (
    <InfoCard title="Payment method" className={className}>
      <InfoCard.Content>
        <Form.Field
          name={'paymentId' as Path<T>}
          control={control}
          render={({ field }) => (
            <Form.Item>
              <Form.Label>Payment method</Form.Label>
              <Select
                value={(field.value as string) || ''}
                onValueChange={field.onChange}
                disabled={loading}
              >
                <Form.Control>
                  <Select.Trigger>
                    <Select.Value
                      placeholder={
                        loading ? 'Loading…' : 'Select payment method'
                      }
                    />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  {payments.map((payment) => (
                    <Select.Item key={payment._id} value={payment._id}>
                      {payment.name} ({payment.kind})
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Form.Message />
            </Form.Item>
          )}
        />
      </InfoCard.Content>
    </InfoCard>
  );
};
