import { UNIT_AREA_TYPE, UNIT_MARKET_TYPE } from '@/unit/constants/unit';
import { Badge, Combobox, Command, Form, Popover, Select } from 'erxes-ui';
import React from 'react';

export const SelectTenureType = ({
  value,
  onValueChange,
  inForm = false,
  readOnly = false,
}: {
  value?: { areaType: string; tenureTypes: string[] };
  onValueChange?: (areaType: string, tenureTypes: string[]) => void;
  inForm?: boolean;
  readOnly?: boolean;
}) => {
  const { areaType, tenureTypes } = value || {};

  const Control = inForm ? Form.Control : React.Fragment;

  const handleAreaType = (type: string) => {
    onValueChange?.(type, []);
  };

  const handleOnValueChange = (type: string) => {
    const currentTenureTypes = tenureTypes?.includes(type)
      ? tenureTypes?.filter((t) => t !== type)
      : [...(tenureTypes || []), type];

    onValueChange?.(areaType || '', currentTenureTypes);
  };

  return (
    <Popover>
      <Control>
        <Combobox.TriggerBase
          className="flex-wrap justify-start h-auto min-h-8 text-accent-foreground"
          disabled={readOnly}
        >
          {!areaType && !tenureTypes?.length && <span>Төрөл сонгоно уу</span>}

          {areaType && (
            <Badge key={areaType} variant="secondary">
              {UNIT_AREA_TYPE[areaType as keyof typeof UNIT_AREA_TYPE]?.mn}
            </Badge>
          )}

          {areaType === 'common' &&
            (tenureTypes || []).map((type) => (
              <Badge key={type} variant="secondary">
                {UNIT_MARKET_TYPE[type as keyof typeof UNIT_MARKET_TYPE]?.mn}
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
                onSelect={() => handleAreaType(key)}
              >
                {type?.mn}
                <Combobox.Check checked={areaType === key} />
              </Command.Item>
            ))}

            <Select.Separator />

            {Object.entries(UNIT_MARKET_TYPE).map(([key, type]) => (
              <Command.Item
                key={key}
                value={key}
                onSelect={() => handleOnValueChange(key)}
                disabled={areaType !== 'common'}
              >
                {type?.mn}
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
