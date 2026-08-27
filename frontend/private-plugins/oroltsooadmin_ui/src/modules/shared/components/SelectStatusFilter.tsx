import {
  Combobox,
  Command,
  Filter,
  Popover,
  PopoverScoped,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import { useState } from 'react';

export type StatusOption = { value: string; label: string };

export const createSelectStatusFilter = ({
  queryKey,
  options,
  placeholder,
  commandId,
}: {
  queryKey: string;
  options: readonly StatusOption[];
  placeholder: string;
  commandId: string;
}) => {
  const Value = ({ value }: { value: string | null }) => {
    const option = options.find((item) => item.value === value);

    if (!option) {
      return <span className="text-accent-foreground/80">{placeholder}</span>;
    }

    return <span>{option.label}</span>;
  };

  const Content = ({
    value,
    onValueChange,
  }: {
    value: string | null;
    onValueChange: (value: string) => void;
  }) => (
    <Command id={commandId}>
      <Command.Input placeholder={placeholder} />
      <Command.List>
        <Command.Empty>Төлөв олдсонгүй</Command.Empty>
        {options.map((option) => (
          <Command.Item
            key={option.value}
            value={option.value}
            onSelect={() =>
              onValueChange(value === option.value ? '' : option.value)
            }
          >
            {option.label}
            <Combobox.Check checked={value === option.value} />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );

  const FilterView = () => {
    const [value, setValue] = useQueryState<string>(queryKey);
    const { resetFilterState } = useFilterContext();

    return (
      <Filter.View filterKey={queryKey}>
        <Content
          value={value}
          onValueChange={(next) => {
            setValue(next);
            resetFilterState();
          }}
        />
      </Filter.View>
    );
  };

  const FilterBar = () => {
    const [value, setValue] = useQueryState<string>(queryKey);
    const [open, setOpen] = useState(false);

    return (
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey}>
            <Value value={value} />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <Content
            value={value}
            onValueChange={(next) => {
              setValue(next);
              setOpen(false);
            }}
          />
        </Combobox.Content>
      </PopoverScoped>
    );
  };

  return { FilterView, FilterBar };
};
