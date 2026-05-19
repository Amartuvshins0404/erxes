import { Form, Input } from 'erxes-ui';
import { SelectPaymentPlan } from './SelectPaymentPlan';
import { SelectPaymentPlanType } from './SelectPaymentPlanType';
import { UseFormReturn } from 'react-hook-form';
import { SelectPaymentPlanFrequency } from './SelectPaymentPlanFrequency';

const ONE_TIME_FREQUENCY = 'ONE_TIME';

export const PaymentPlanForm = ({ form }: { form: UseFormReturn<any> }) => {
  const frequency = form.watch('paymentPlan.frequency');
  const isOneTime = frequency === ONE_TIME_FREQUENCY;

  const handlePercentChange =
    (callback: (value: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      callback(Math.min(Math.max(Number(e.target.value), 0), 100));
    };

  const parsePaymentDates = (raw: string): number[] => {
    return raw
      .split(/[,\s]+/)
      .map((p) => parseInt(p, 10))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 31);
  };
  return (
    <>
      <Form.Field
        name="paymentPlanId"
        render={({ field }) => (
          <Form.Item className="col-start-1">
            <Form.Label>Payment plan</Form.Label>
            <SelectPaymentPlan
              value={field.value}
              onValueChange={field.onChange}
              form={form}
            />
          </Form.Item>
        )}
      />
      <Form.Field
        name="paymentPlan.type"
        render={({ field }) => (
          <Form.Item className="col-start-1">
            <Form.Label>type</Form.Label>
            <SelectPaymentPlanType
              value={field.value}
              onValueChange={field.onChange}
              inForm
            />
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        name="paymentPlan.discountPercentage"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>discount percentage</Form.Label>
            <Input
              {...field}
              onChange={handlePercentChange(field.onChange)}
              type="number"
              max={100}
              min={0}
            />
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        name="paymentPlan.downPaymentPercentage"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>down payment percentage</Form.Label>
            <Input
              {...field}
              onChange={handlePercentChange(field.onChange)}
              type="number"
              max={100}
              min={0}
            />
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        name="paymentPlan.interestPercentage"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>interest percentage</Form.Label>
            <Input
              {...field}
              onChange={handlePercentChange(field.onChange)}
              type="number"
              max={100}
              min={0}
            />
            <Form.Message />
          </Form.Item>
        )}
      />
      <Form.Field
        name="paymentPlan.frequency"
        render={({ field }) => (
          <Form.Item>
            <Form.Label>frequency</Form.Label>
            <SelectPaymentPlanFrequency
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                if (value === ONE_TIME_FREQUENCY) {
                  form.setValue('paymentPlan.installment', 1);
                  form.setValue('paymentPlan.paymentDates', []);
                }
              }}
              inForm
            />
            <Form.Message />
          </Form.Item>
        )}
      />
      {!isOneTime && (
        <Form.Field
          name="paymentPlan.installment"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>installment</Form.Label>
              <Input
                {...field}
                value={field.value ?? ''}
                onChange={(e) => field.onChange(Number(e.target.value))}
                type="number"
                min={0}
              />
              <Form.Message />
            </Form.Item>
          )}
        />
      )}
      {!isOneTime && (
        <Form.Field
          name="paymentPlan.paymentDates"
          render={({ field }) => (
            <Form.Item>
              <Form.Label>payment dates (day of month)</Form.Label>
              <Input
                value={
                  Array.isArray(field.value) ? field.value.join(', ') : ''
                }
                onChange={(e) => field.onChange(parsePaymentDates(e.target.value))}
                placeholder="e.g. 15, 30"
              />
              <Form.Message />
            </Form.Item>
          )}
        />
      )}
    </>
  );
};
