import {
  Badge,
  Combobox,
  Command,
  Form,
  Popover,
  useQueryState,
} from 'erxes-ui';
import React from 'react';
import { useBuildingZonings } from '../hooks/useBuildings';
import { IZoning } from '../types/buildingTypes';

export const SelectBuildingZone = ({
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
  const [buildingId] = useQueryState<string>('buildingId');

  const { buildingZonings = [] } = useBuildingZonings({ buildingId });

  const Control = inForm ? Form.Control : React.Fragment;

  return (
    <Popover>
      <Control>
        <Combobox.TriggerBase
          className="flex-wrap justify-start h-auto min-h-8"
          disabled={readOnly}
        >
          {value?.length ? (
            (value || []).map((type: string) => {
              const zoning = buildingZonings.find(
                (zoning: IZoning) => zoning._id === type,
              );

              return (
                <Badge key={type} variant="secondary">
                  {zoning?.floor} Floor
                </Badge>
              );
            })
          ) : (
            <span>Төрөл сонгоно уу</span>
          )}
        </Combobox.TriggerBase>
      </Control>

      <Combobox.Content>
        <Command>
          <Command.Input />
          <Command.List>
            {(buildingZonings || []).map((zoning: IZoning) => (
              <Command.Item
                value={zoning._id}
                key={zoning._id}
                onSelect={() => {
                  const zoningIds = value?.includes(zoning._id)
                    ? value?.filter((id) => id !== zoning._id)
                    : [...(value || []), zoning._id];

                  onValueChange?.(zoningIds);
                }}
              >
                {zoning.floor} Floor
                <Combobox.Check checked={value?.includes(zoning._id)} />
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Combobox.Content>
    </Popover>
  );
};
