import { Form, Select } from 'erxes-ui';
import { PAYMENT_PLAN_FREQUENCY } from '@/pricing/constants/paymentPlans';
import React from 'react';

export const SelectPaymentPlanFrequency = ({
  value,
  onValueChange,
  inForm = false,
}: {
  value: string;
  inForm?: boolean;
  onValueChange: (value: string) => void;
}) => {
  const Control = inForm ? Form.Control : React.Fragment;
  return (
    <Select value={value} onValueChange={onValueChange}>
      <Control>
        <Select.Trigger className="h-8">
          <Select.Value />
        </Select.Trigger>
      </Control>
      <Select.Content>
        {Object.entries(PAYMENT_PLAN_FREQUENCY).map(([key, value]) => (
          <Select.Item key={key} value={key}>
            {value}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
