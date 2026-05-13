import {
  Badge,
  cn,
  Combobox,
  Command,
  Filter,
  Form,
  Popover,
  PopoverScoped,
  RecordTableInlineCell,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import { SelectUnitStatusesContext } from '../context/select-unit-statuses';
import { useSelectUnitStatusesContext } from '../hooks/useSelectUnitStatusesContext';
import { TSelectUnitStatusesProvider } from '../types/unit-contexts';
import { useState } from 'react';
import { UNIT_LEASE_STATUS } from '../constants/status';
import { IconCircleFilled } from '@tabler/icons-react';

export const SelectUnitStatusesProvider = ({
  children,
  value,
  onValueChange,
  mode = 'single',
}: TSelectUnitStatusesProvider) => {
  const selectedValues = value ? (Array.isArray(value) ? value : [value]) : [];
  return (
    <SelectUnitStatusesContext.Provider
      value={{ value, selectedValues, onValueChange, mode }}
    >
      {children}
    </SelectUnitStatusesContext.Provider>
  );
};

export const SelectUnitStatusesRoot = () => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <SelectUnitStatusesValue />
      </Popover.Trigger>
      <Popover.Content>
        <SelectUnitStatusesContent />
      </Popover.Content>
    </Popover>
  );
};

export const SelectUnitStatusesValue = ({
  placeholder,
}: {
  placeholder?: string;
}) => {
  const { selectedValues } = useSelectUnitStatusesContext();
  if (!selectedValues.length) {
    return <span>{placeholder}</span>;
  }
  if (selectedValues.length === 1) {
    return (
      <span className="flex items-center gap-2">
        <IconCircleFilled
          className="size-3 shrink"
          style={{
            fill: UNIT_LEASE_STATUS[
              selectedValues[0] as keyof typeof UNIT_LEASE_STATUS
            ]?.color,
          }}
        />
        {
          UNIT_LEASE_STATUS[selectedValues[0] as keyof typeof UNIT_LEASE_STATUS]
            ?.en
        }
      </span>
    );
  }

  if (selectedValues.length > 2) {
    return <span>2+ statuses selected</span>;
  }
  return (
    <span className="flex items-center gap-2">
      {selectedValues.map((v) => (
        <Badge
          style={{
            backgroundColor: `color-mix(in oklch, ${
              UNIT_LEASE_STATUS[v as keyof typeof UNIT_LEASE_STATUS]?.color
            } 20%, transparent)`,
            color:
              UNIT_LEASE_STATUS[v as keyof typeof UNIT_LEASE_STATUS]?.color,
          }}
          key={v}
        >
          {UNIT_LEASE_STATUS[v as keyof typeof UNIT_LEASE_STATUS]?.en}
        </Badge>
      ))}
    </span>
  );
};

export const SelectUnitStatusesContent = () => {
  const { selectedValues, onValueChange, mode } =
    useSelectUnitStatusesContext();

  const handleSelect = (key: string) => {
    if (mode === 'multiple') {
      const next = selectedValues.includes(key)
        ? selectedValues.filter((v) => v !== key)
        : [...selectedValues, key];
      onValueChange?.(next);
    } else {
      onValueChange?.(key);
    }
  };

  return (
    <Command>
      <Command.List>
        <Command.Input placeholder="Search statuses" />
        {Object.entries(UNIT_LEASE_STATUS).map(([key, value]) => (
          <Command.Item key={key} value={key} onSelect={handleSelect}>
            <IconCircleFilled
              className="size-3 shrink"
              style={{ fill: value.color }}
            />
            {value.en}
            <Combobox.Check checked={selectedValues?.includes(key)} />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
};

export const SelectUnitStatusesFilterView = ({
  onValueChange,
  queryKey,
  mode = 'single',
}: {
  onValueChange?: (value: string[] | string) => void;
  queryKey?: string;
  mode?: 'single' | 'multiple';
}) => {
  const [status, setStatus] = useQueryState<string[] | string>(
    queryKey || 'statuses',
  );
  const { resetFilterState } = useFilterContext();
  return (
    <Filter.View filterKey="statuses">
      <SelectUnitStatusesProvider
        value={status as string}
        mode={mode}
        onValueChange={(value) => {
          setStatus(value as string[] | string);
          resetFilterState();
          onValueChange?.(value as string | string[]);
        }}
      >
        <SelectUnitStatusesContent />
      </SelectUnitStatusesProvider>
    </Filter.View>
  );
};

export const SelectUnitStatusesFilterBarItem = ({
  queryKey,
  mode = 'single',
}: {
  queryKey?: string;
  mode?: 'single' | 'multiple';
}) => {
  const [status, setStatus] = useQueryState<string | string[]>(
    queryKey || 'statuses',
  );
  const [open, setOpen] = useState(false);

  return (
    <SelectUnitStatusesProvider
      value={status as string | string[]}
      mode={mode}
      onValueChange={(value) => {
        setStatus(value as string | string[]);
        if (mode === 'single') setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'statuses'}>
            <SelectUnitStatusesValue />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <SelectUnitStatusesContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectUnitStatusesProvider>
  );
};

export const SelectUnitStatusesFormItem = ({
  value,
  onValueChange,
  className,
  placeholder,
}: Omit<React.ComponentProps<typeof SelectUnitStatusesProvider>, 'children'> & {
  className?: string;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <SelectUnitStatusesProvider
      mode="single"
      value={value}
      onValueChange={(value) => {
        onValueChange?.(value);
        setOpen(false);
      }}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <Form.Control>
          <Combobox.Trigger className={cn('w-full shadow-xs', className)}>
            <SelectUnitStatusesValue placeholder={placeholder} />
          </Combobox.Trigger>
        </Form.Control>

        <Combobox.Content>
          <SelectUnitStatusesContent />
        </Combobox.Content>
      </Popover>
    </SelectUnitStatusesProvider>
  );
};

const SelectUnitStatusesInlineCell = ({
  onValueChange,
  scope,
  ...props
}: Omit<React.ComponentProps<typeof SelectUnitStatusesProvider>, 'children'> & {
  scope?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectUnitStatusesProvider
      mode="single"
      onValueChange={(value) => {
        onValueChange?.(value);
        if (props.mode === 'single') {
          setOpen(false);
        }
      }}
      {...props}
    >
      <PopoverScoped open={open} onOpenChange={setOpen} scope={scope}>
        <RecordTableInlineCell.Trigger>
          <SelectUnitStatusesValue />
        </RecordTableInlineCell.Trigger>
        <RecordTableInlineCell.Content>
          <SelectUnitStatusesContent />
        </RecordTableInlineCell.Content>
      </PopoverScoped>
    </SelectUnitStatusesProvider>
  );
};

export const SelectUnitStatuses = Object.assign(SelectUnitStatusesRoot, {
  Provider: SelectUnitStatusesProvider,
  Value: SelectUnitStatusesValue,
  Content: SelectUnitStatusesContent,
  FilterView: SelectUnitStatusesFilterView,
  FilterBar: SelectUnitStatusesFilterBarItem,
  FormItem: SelectUnitStatusesFormItem,
  InlineCell: SelectUnitStatusesInlineCell,
});
