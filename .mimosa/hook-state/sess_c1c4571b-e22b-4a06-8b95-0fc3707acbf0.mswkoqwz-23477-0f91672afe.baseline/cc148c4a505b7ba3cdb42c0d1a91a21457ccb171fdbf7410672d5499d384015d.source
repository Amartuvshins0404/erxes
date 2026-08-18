import { UNIT_AREA_TYPE, UNIT_MARKET_TYPE } from '@/unit/constants/unit';
import { useState } from 'react';
import {
  Badge,
  Combobox,
  Command,
  Filter,
  Popover,
  Select,
  useQueryState,
} from 'erxes-ui';

const parseTenureValue = (value: string | null) => {
  if (!value) return { areaType: '', tenureTypes: [] as string[] };
  const [areaType, ...tenureTypes] = value.split(':');
  return { areaType, tenureTypes };
};

const buildTenureValue = (areaType: string, tenureTypes: string[]) => {
  if (!areaType) return null;
  if (tenureTypes.length === 0) return areaType;
  return [areaType, ...tenureTypes].join(':');
};

const SelectTenureTypeContent = ({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) => {
  const { areaType, tenureTypes } = parseTenureValue(value);

  const handleAreaType = (key: string) => {
    if (areaType === key) {
      onValueChange(null);
    } else {
      onValueChange(buildTenureValue(key, []));
    }
  };

  const handleTenureType = (key: string) => {
    const updated = tenureTypes.includes(key)
      ? tenureTypes.filter((t) => t !== key)
      : [...tenureTypes, key];
    onValueChange(buildTenureValue(areaType, updated));
  };

  return (
    <Command>
      <Command.Input placeholder="Search tenure type..." />
      <Command.List className="p-1">
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
            onSelect={() => handleTenureType(key)}
            disabled={areaType !== 'common'}
          >
            {type?.mn}
            <Combobox.Check
              checked={areaType === 'common' && tenureTypes.includes(key)}
            />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
};

const SelectTenureTypeFilterView = () => {
  const [tenureType, setTenureType] = useQueryState<string>('tenureType');
  return (
    <Filter.View filterKey="tenureType">
      <SelectTenureTypeContent
        value={tenureType}
        onValueChange={setTenureType}
      />
    </Filter.View>
  );
};

const SelectTenureTypeFilterBar = () => {
  const [tenureType, setTenureType] = useQueryState<string>('tenureType');
  const [open, setOpen] = useState(false);
  const { areaType, tenureTypes } = parseTenureValue(tenureType);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="font-medium text-sm cursor-pointer">
        <Filter.BarButton filterKey="tenureType">
          <span className="flex items-center gap-1">
            {areaType && (
              <Badge variant="secondary" className="text-xs">
                {UNIT_AREA_TYPE[areaType as keyof typeof UNIT_AREA_TYPE]?.mn}
              </Badge>
            )}
            {areaType === 'common' &&
              tenureTypes.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {UNIT_MARKET_TYPE[t as keyof typeof UNIT_MARKET_TYPE]?.mn}
                </Badge>
              ))}
          </span>
        </Filter.BarButton>
      </Popover.Trigger>
      <Popover.Content className="p-0 w-56" align="start">
        <SelectTenureTypeContent
          value={tenureType}
          onValueChange={setTenureType}
        />
      </Popover.Content>
    </Popover>
  );
};

export const SelectTenureTypeFilter = Object.assign(() => null, {
  FilterView: SelectTenureTypeFilterView,
  FilterBar: SelectTenureTypeFilterBar,
});
