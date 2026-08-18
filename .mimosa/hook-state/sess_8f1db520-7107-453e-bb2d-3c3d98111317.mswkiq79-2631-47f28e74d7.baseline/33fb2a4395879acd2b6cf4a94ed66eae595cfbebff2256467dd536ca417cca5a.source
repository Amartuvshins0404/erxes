import { Form, Select } from 'erxes-ui';
import { PAYMENT_PLAN_TYPE } from '@/pricing/constants/paymentPlans';
import React from 'react';

export const SelectPaymentPlanType = ({
  value,
  onValueChange,
  inForm = false,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  inForm?: boolean;
}) => {
  const Control = inForm ? Form.Control : React.Fragment;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <Control>
        <Select.Trigger className={'h-8'}>
          <Select.Value />
        </Select.Trigger>
      </Control>
      <Select.Content>
        {Object.entries(PAYMENT_PLAN_TYPE)?.map(([key, paymentPlan]) => (
          <Select.Item key={key} value={key}>
            {paymentPlan}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
