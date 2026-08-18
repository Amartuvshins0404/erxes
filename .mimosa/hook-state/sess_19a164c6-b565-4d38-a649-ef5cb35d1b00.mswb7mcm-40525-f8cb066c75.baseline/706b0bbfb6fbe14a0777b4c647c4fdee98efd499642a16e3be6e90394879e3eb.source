import { UNIT_AREA_TYPE, UNIT_MARKET_TYPE } from '@/unit/constants/unit';
import { Badge, Combobox, Command, Form, Popover, Select } from 'erxes-ui';
import React from 'react';

export const SelectTenureType = ({
  value,
  inForm = false,
}: {
  value?: string;
  inForm?: boolean;
}) => {
  const Control = inForm ? Form.Control : React.Fragment;
  return (
    <Select value={value}>
      <Control>
        <Select.Trigger className="h-8 bg-background">
          <Select.Value />
        </Select.Trigger>
      </Control>
      <Select.Content>
        {Object.entries(UNIT_MARKET_TYPE).map(([key, type]) => (
          <Select.Item key={key} value={key}>
            {type.mn}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  );
};

export const SelectTenureTypes = ({
  value,
  inForm = false,
}: {
  value?: { areaType: string; tenureTypes: string[] };
  inForm?: boolean;
}) => {
  const { areaType, tenureTypes } = value || {};

  const Control = inForm ? Form.Control : React.Fragment;
  return (
    <Popover>
      <Control>
        <Combobox.TriggerBase
          className="flex-wrap justify-start h-auto min-h-8 text-accent-foreground"
        >
          {!areaType && !tenureTypes?.length && <span>Төрөл сонгоно уу</span>}

          {areaType && (
            <Badge key={areaType} variant="secondary">
              {UNIT_AREA_TYPE[areaType as keyof typeof UNIT_AREA_TYPE].mn}
            </Badge>
          )}

          {areaType === 'common' &&
            (tenureTypes || []).map((type) => (
              <Badge key={type} variant="secondary">
                {UNIT_MARKET_TYPE[type as keyof typeof UNIT_MARKET_TYPE].mn}
              </Badge>
            ))}
        </Combobox.TriggerBase>
      </Control>

      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {Object.entries(UNIT_AREA_TYPE).map(([key, type]) => (
              <Command.Item
                key={key}
                value={key}
              >
                {type.mn}
                <Combobox.Check checked={areaType === key} />
              </Command.Item>
            ))}

            <Select.Separator />

            {Object.entries(UNIT_MARKET_TYPE).map(([key, type]) => (
              <Command.Item
                key={key}
                value={key}
                disabled={areaType !== 'common'}
              >
                {type.mn}
                <Combobox.Check
                  checked={areaType === 'common' && tenureTypes?.includes(key)}
                />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
