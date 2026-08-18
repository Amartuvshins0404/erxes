import { useState } from 'react';
import {
  Combobox,
  Command,
  Filter,
  Popover,
  useQueryState,
} from 'erxes-ui';

const CUSTOMER_SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'form', label: 'Form' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'other', label: 'Other' },
];

const SelectCustomerSourceContent = ({
  value,
  onValueChange,
}: {
  value: string | null;
  onValueChange: (value: string | null) => void;
}) => {
  return (
    <Command>
      <Command.Input placeholder="Search source..." />
      <Command.List className="p-1">
        {CUSTOMER_SOURCE_OPTIONS.map((opt) => (
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

const SelectCustomerSourceFilterView = () => {
  const [customerSource, setCustomerSource] =
    useQueryState<string>('customerSource');
  return (
    <Filter.View filterKey="customerSource">
      <SelectCustomerSourceContent
        value={customerSource}
        onValueChange={setCustomerSource}
      />
    </Filter.View>
  );
};

const SelectCustomerSourceFilterBar = () => {
  const [customerSource, setCustomerSource] =
    useQueryState<string>('customerSource');
  const [open, setOpen] = useState(false);
  const label =
    CUSTOMER_SOURCE_OPTIONS.find((o) => o.value === customerSource)?.label ||
    '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="text-sm font-medium cursor-pointer">
        <Filter.BarButton filterKey={'customerSource'}>
          {label}
        </Filter.BarButton>
      </Popover.Trigger>
      <Popover.Content className="p-0 w-48" align="start">
        <SelectCustomerSourceContent
          value={customerSource}
          onValueChange={(v) => {
            setCustomerSource(v);
            setOpen(false);
          }}
        />
      </Popover.Content>
    </Popover>
  );
};

export const SelectCustomerSource = Object.assign(() => null, {
  FilterView: SelectCustomerSourceFilterView,
  FilterBar: SelectCustomerSourceFilterBar,
  OPTIONS: CUSTOMER_SOURCE_OPTIONS,
});
