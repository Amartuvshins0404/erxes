import { useUnitTypes } from '@/unit/hooks/useUnitTypes';
import { Form, Select, useQueryState } from 'erxes-ui';
import React from 'react';
import { useParams } from 'react-router-dom';

export const SelectUnitType = ({
  value,
  onValueChange,
  inForm = false,
  projectId: projectIdProp,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  inForm?: boolean;
  projectId?: string;
}) => {
  const { id, projectId: projectIdParam } = useParams();

  const { unitTypes } = useUnitTypes({
    project: projectIdProp || id || (projectIdParam as string),
  });
  const Control = inForm ? Form.Control : React.Fragment;

  const handleValueChange = (val: string) => {
    onValueChange?.(val);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
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
