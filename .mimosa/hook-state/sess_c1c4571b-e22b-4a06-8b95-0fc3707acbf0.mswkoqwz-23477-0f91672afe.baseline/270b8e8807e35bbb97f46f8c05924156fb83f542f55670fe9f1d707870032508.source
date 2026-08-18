import { Select, Form } from 'erxes-ui';
import { UNIT_ROOM_COUNT } from '@/unit/constants/unit';
import React from 'react';

export const SelectRoomCount = ({
  value,
  onValueChange,
  inForm = false,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  inForm?: boolean;
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
        {Object.entries(UNIT_ROOM_COUNT).map(([key, type]) => (
          <Select.Item key={key} value={key}>
            {type.mn}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};
