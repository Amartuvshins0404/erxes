import {
  UNIT_EXTRA_OPTIONS,
  UNIT_USAGE_ROOMS,
  UNIT_USAGE_SUBTYPES,
  UNIT_USAGE_TYPE,
} from '@/unit/constants/unit';
import { Badge, Combobox, Command, Form, Popover, Select } from 'erxes-ui';
import React from 'react';

export const SelectUsageTypeRoom = ({
  type,
  value,
  onValueChange,
  inForm = false,
}: {
  type?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  inForm?: boolean;
}) => {
  if (!type) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <Select.Trigger className="bg-background h-8">
          No usage type
        </Select.Trigger>
      </Select>
    );
  }

  const Control = inForm ? Form.Control : React.Fragment;

  const rooms = UNIT_USAGE_ROOMS[type as keyof typeof UNIT_USAGE_ROOMS] || [];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <Control>
        <Select.Trigger className="bg-background h-8">
          <Select.Value />
        </Select.Trigger>
      </Control>
      <Select.Content>
        {rooms.map((room) => (
          <Select.Item key={room.value} value={room.value}>
            {room.label.mn}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};

export const SelectUsageSubType = ({
  type,
  value,
  onValueChange,
  inForm = false,
}: {
  type?: string;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  inForm?: boolean;
}) => {
  if (!type) {
    return (
      <Select>
        <Select.Trigger className="bg-background h-8">
          No usage type
        </Select.Trigger>
      </Select>
    );
  }

  const Control = inForm ? Form.Control : React.Fragment;

  const subTypes = UNIT_USAGE_SUBTYPES[type] || [];

  return (
    <Popover>
      <Control>
        <Combobox.TriggerBase className="flex-wrap justify-start h-auto min-h-8 text-accent-foreground">
          {value?.length ? (
            value.map((type) => (
              <Badge key={type} variant="secondary">
                {subTypes.find((t) => t.value === type)?.label?.mn}
              </Badge>
            ))
          ) : (
            <span>Төрөл сонгоно уу</span>
          )}
        </Combobox.TriggerBase>
      </Control>

      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {subTypes.map((type) => (
              <Command.Item
                value={type.value}
                key={type.value}
                onSelect={() => {
                  const newTypes = value?.includes(type.value)
                    ? value?.filter((t) => t !== type.value)
                    : [...(value || []), type.value];

                  onValueChange?.(newTypes);
                }}
              >
                {type.label?.mn}
                <Combobox.Check checked={value?.includes(type.value)} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

export const SelectUsageFeatureType = ({
  type,
  value,
  onValueChange,
  inForm = false,
}: {
  type?: string;
  value?: string[];
  onValueChange?: (value: string[]) => void;
  inForm?: boolean;
}) => {
  if (!type) {
    return (
      <Select>
        <Select.Trigger className="bg-background h-8">
          No usage type
        </Select.Trigger>
      </Select>
    );
  }

  if (['serviceArea', 'parking', 'basement', 'retail'].includes(type || '')) {
    const typeLabel = UNIT_USAGE_TYPE[type as keyof typeof UNIT_USAGE_TYPE];

    return (
      <Select>
        <Select.Trigger className="bg-background h-8">
          No feature type for {typeLabel?.mn}
        </Select.Trigger>
      </Select>
    );
  }

  const Control = inForm ? Form.Control : React.Fragment;

  return (
    <Popover>
      <Control>
        <Combobox.TriggerBase className="flex-wrap justify-start h-auto min-h-8 text-accent-foreground">
          {value?.length ? (
            value.map((type) => (
              <Badge key={type} variant="secondary">
                {UNIT_EXTRA_OPTIONS.find((t) => t.value === type)?.label?.mn}
              </Badge>
            ))
          ) : (
            <span>Төрөл сонгоно уу</span>
          )}
        </Combobox.TriggerBase>
      </Control>

      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {UNIT_EXTRA_OPTIONS.map((type) => (
              <Command.Item
                value={type.value}
                key={type.value}
                onSelect={() => {
                  const newTypes = value?.includes(type.value)
                    ? value?.filter((t) => t !== type.value)
                    : [...(value || []), type.value];

                  onValueChange?.(newTypes);
                }}
              >
                {type.label?.mn}
                <Combobox.Check checked={value?.includes(type.value)} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
