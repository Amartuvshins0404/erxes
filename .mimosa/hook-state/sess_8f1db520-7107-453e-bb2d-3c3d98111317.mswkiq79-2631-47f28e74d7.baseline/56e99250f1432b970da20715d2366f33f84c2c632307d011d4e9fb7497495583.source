import { UNIT_LEASE_STATUS, UNIT_SALE_STATUS } from '@/unit/constants/unit';
import { Form, Select } from 'erxes-ui';
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

  return (
    <Select value={value || 'available'} onValueChange={onValueChange}>
      <Control>
        <Select.Trigger className="h-8" disabled={value === 'onHold'}>
          <Select.Value />
        </Select.Trigger>
      </Control>
      <Select.Content>
        {Object.entries(statuses).map(([key, type]) => (
          <Select.Item key={key} value={key} disabled={key === 'onHold'}>
            {type.mn}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
