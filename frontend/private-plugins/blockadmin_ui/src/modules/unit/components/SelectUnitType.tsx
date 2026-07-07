import { useUnitTypes } from '@/unit/hooks/useUnitTypes';
import { Form, Select } from 'erxes-ui';
import React from 'react';
import { useParams } from 'react-router-dom';

export const SelectUnitType = ({
  value,
  onValueChange,
  inForm = false,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  inForm?: boolean;
}) => {
  const { id } = useParams();
  const { unitTypes } = useUnitTypes({ project: id });
  const Control = inForm ? Form.Control : React.Fragment;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <Control>
        <Select.Trigger className="h-8 bg-background">
          <Select.Value placeholder="Select unit type" />
        </Select.Trigger>
      </Control>
      <Select.Content>
        {unitTypes?.map((type) => (
          <Select.Item key={type._id} value={type._id}>
            {type.name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
