import { UNIT_USAGE_TYPE } from '@/unit/constants/unit';
import { Badge, Combobox, Command, Form, Popover } from 'erxes-ui';
import React from 'react';

export const SelectUsageType = ({
  value,
  onValueChange,
  inForm = false,
  readOnly = false,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  inForm?: boolean;
  readOnly?: boolean;
}) => {
  const Control = inForm ? Form.Control : React.Fragment;

  return (
    <Popover>
      <Control>
        <Combobox.TriggerBase
          className="flex-wrap justify-start h-auto min-h-8"
          disabled={readOnly}
        >
          {value ? (
            UNIT_USAGE_TYPE[value]?.mn
          ) : (
            <span className="text-accent-foreground">Төрөл сонгоно уу</span>
          )}
        </Combobox.TriggerBase>
      </Control>

      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {Object.entries(UNIT_USAGE_TYPE).map(([key, label]) => (
              <Command.Item
                value={key}
                key={key}
                onSelect={() => {
                  onValueChange?.(key);
                }}
              >
                {label?.mn}
                <Combobox.Check checked={value === key} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};

export const SelectUsageTypes = ({
  value,
  onValueChange,
  inForm = false,
  readOnly = false,
}: {
  value?: string[];
  onValueChange?: (value: string[]) => void;
  inForm?: boolean;
  readOnly?: boolean;
}) => {
  const Control = inForm ? Form.Control : React.Fragment;

  return (
    <Popover>
      <Control>
        <Combobox.TriggerBase
          className="flex-wrap justify-start h-auto min-h-8 text-accent-foreground"
          disabled={readOnly}
        >
          {value?.length ? (
            value.map((type: string) => (
              <Badge key={type} variant="secondary">
                {UNIT_USAGE_TYPE[type]?.mn}
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
            {Object.entries(UNIT_USAGE_TYPE).map(([key, label]) => (
              <Command.Item
                value={key}
                key={key}
                onSelect={() => {
                  const newTypes = value?.includes(key)
                    ? value?.filter((t: string) => t !== key)
                    : [...(value || []), key];

                  onValueChange?.(newTypes);
                }}
              >
                {label?.mn}
                <Combobox.Check checked={value?.includes(key)} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
