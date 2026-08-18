import { Form, Select } from 'erxes-ui';
import { UNIT_LEASE_STATUS, UNIT_SALE_STATUS } from '@/unit/constants/unit';
import React from 'react';

export const SelectUnitStatus = ({
  value = 'available',
  onValueChange,
  inForm = false,
  tenureType,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  inForm?: boolean;
  tenureType?: string;
}) => {
  const Control = inForm ? Form.Control : React.Fragment;

  const statuses =
    tenureType === 'forSale' ? UNIT_SALE_STATUS : UNIT_LEASE_STATUS;

  console.log(value);

  return (
    <Select value={value || 'available'} onValueChange={onValueChange}>
      <Control>
        <Select.Trigger className="h-8">
          <Select.Value />
        </Select.Trigger>
      </Control>
      <Select.Content>
        {Object.entries(statuses).map(([key, type]) => (
          <Select.Item key={key} value={key}>
            {type.mn}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
