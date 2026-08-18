import { useUnitTypes } from '@/unit/hooks/useUnitTypes';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Combobox, Command, Filter, Popover, useQueryState } from 'erxes-ui';

const SelectUnitTypeContent = ({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) => {
  const { id, projectId } = useParams();
  const { unitTypes } = useUnitTypes({ project: id || (projectId as string) });

  return (
    <Command>
      <Command.Input placeholder="Search unit type..." />
      <Command.List className="p-1">
        {unitTypes?.map((type) => (
          <Command.Item
            key={type._id}
            value={type.name}
            onSelect={() =>
              onValueChange(value === type._id ? null : type._id)
            }
          >
            {type.name}
            <Combobox.Check checked={value === type._id} />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
};

const SelectUnitTypeFilterView = () => {
  const [unitType, setUnitType] = useQueryState<string>('unitType');
  return (
    <Filter.View filterKey="unitType">
      <SelectUnitTypeContent value={unitType} onValueChange={setUnitType} />
    </Filter.View>
  );
};

const SelectUnitTypeFilterBar = () => {
  const { id, projectId } = useParams();
  const { unitTypes } = useUnitTypes({ project: id || (projectId as string) });
  const [unitType, setUnitType] = useQueryState<string>('unitType');
  const [open, setOpen] = useState(false);
  const label = unitTypes?.find((t) => t._id === unitType)?.name || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="font-medium text-sm cursor-pointer">
        <Filter.BarButton filterKey="unitType">{label}</Filter.BarButton>
      </Popover.Trigger>
      <Popover.Content className="p-0 w-48" align="start">
        <SelectUnitTypeContent
          value={unitType}
          onValueChange={(v) => {
            setUnitType(v);
            setOpen(false);
          }}
        />
      </Popover.Content>
    </Popover>
  );
};

export const SelectUnitTypeFilter = Object.assign(() => null, {
  FilterView: SelectUnitTypeFilterView,
  FilterBar: SelectUnitTypeFilterBar,
});
