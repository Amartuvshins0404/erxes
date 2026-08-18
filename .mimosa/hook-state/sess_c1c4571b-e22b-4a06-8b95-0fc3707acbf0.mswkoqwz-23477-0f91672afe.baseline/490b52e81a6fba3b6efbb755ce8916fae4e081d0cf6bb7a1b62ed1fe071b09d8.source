import { useState } from 'react';
import { Combobox, Command, Filter, Popover, useQueryState } from 'erxes-ui';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const SelectPriorityContent = ({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) => {
  return (
    <Command>
      <Command.List className="p-1">
        {PRIORITY_OPTIONS.map((opt) => (
          <Command.Item
            key={opt.value}
            value={opt.value}
            onSelect={() =>
              onValueChange(value === opt.value ? null : opt.value)
            }
          >
            {opt.label}
            <Combobox.Check checked={value === opt.value} />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
};

const SelectPriorityFilterView = () => {
  const [priority, setPriority] = useQueryState<string>('priority');
  return (
    <Filter.View filterKey="priority">
      <SelectPriorityContent value={priority} onValueChange={setPriority} />
    </Filter.View>
  );
};

const SelectPriorityFilterBar = () => {
  const [priority, setPriority] = useQueryState<string>('priority');
  const [open, setOpen] = useState(false);
  const label = PRIORITY_OPTIONS.find((o) => o.value === priority)?.label || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="font-medium text-sm cursor-pointer">
        <Filter.BarButton filterKey={'assignedUserId'}>
          {label}
        </Filter.BarButton>
      </Popover.Trigger>
      <Popover.Content className="p-0 w-40" align="start">
        <SelectPriorityContent
          value={priority}
          onValueChange={(v) => {
            setPriority(v);
            setOpen(false);
          }}
        />
      </Popover.Content>
    </Popover>
  );
};

export const SelectOpptyPriority = Object.assign(() => null, {
  FilterView: SelectPriorityFilterView,
  FilterBar: SelectPriorityFilterBar,
  OPTIONS: PRIORITY_OPTIONS,
});
