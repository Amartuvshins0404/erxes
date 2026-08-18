import { BLOCK_PROJECT_STATUS } from '@/project/constants/project';
import {
  Combobox,
  Command,
  Filter,
  Popover,
  PopoverScoped,
  SelectOperationContent,
  SelectTriggerOperation,
  SelectTriggerVariant,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import React, { useState } from 'react';

interface SelectProjectStatusContextType {
  value?: string;
  onValueChange: (value: string) => void;
  variant?: `${SelectTriggerVariant}`;
}

const SelectProjectStatusContext =
  React.createContext<SelectProjectStatusContextType | null>(null);

const useSelectProjectStatusContext = () => {
  const context = React.useContext(SelectProjectStatusContext);
  if (!context) {
    throw new Error(
      'useSelectStatusContext must be used within SelectStatusProvider',
    );
  }
  return context;
};

export const SelectProjectStatusProvider = ({
  children,
  value,
  onValueChange,
  variant,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
  variant?: `${SelectTriggerVariant}`;
}) => {
  const handleValueChange = (value: string) => {
    if (!value) return;
    onValueChange(value);
  };

  return (
    <SelectProjectStatusContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        variant,
      }}
    >
      {children}
    </SelectProjectStatusContext.Provider>
  );
};

const SelectProjectStatusValue = ({
  placeholder,
}: {
  placeholder?: string;
}) => {
  const { value } = useSelectProjectStatusContext();

  if (!value) {
    return (
      <span className="text-accent-foreground/80">
        {placeholder || 'Select status...'}
      </span>
    );
  }

  const status = Object.entries(BLOCK_PROJECT_STATUS).find(
    ([key]) => key === value,
  );

  return <>{status?.[1].text}</>;
};

const SelectProjectStatusCommandItem = ({
  status,
  text,
}: {
  status: string;
  text: string;
}) => {
  const { onValueChange, value } = useSelectProjectStatusContext();

  return (
    <Command.Item
      value={status}
      key={status}
      onSelect={() => {
        const newStatus = value === status ? '' : status;

        onValueChange(newStatus);
      }}
    >
      {text}
      <Combobox.Check checked={value === status} />
    </Command.Item>
  );
};

const SelectProjectStatusContent = () => {
  return (
    <Command id="status-command-menu">
      <Command.Input placeholder="Төрөл сонгоно уу" />
      <Command.List>
        <Command.Empty>No status found</Command.Empty>
        {Object.entries(BLOCK_PROJECT_STATUS).map(([key, status]) => (
          <SelectProjectStatusCommandItem
            key={key}
            status={key}
            text={status.text}
          />
        ))}
      </Command.List>
    </Command>
  );
};

const SelectProjectStatusFilterView = ({ queryKey }: { queryKey?: string }) => {
  const [types, setStatus] = useQueryState<string>(queryKey || 'status');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={queryKey || 'status'}>
      <SelectProjectStatusProvider
        value={types as string}
        onValueChange={(value) => {
          setStatus(value);
          resetFilterState();
        }}
      >
        <SelectProjectStatusContent />
      </SelectProjectStatusProvider>
    </Filter.View>
  );
};

const SelectProjectStatusFilterBar = ({ queryKey }: { queryKey?: string }) => {
  const [status, setStatus] = useQueryState<string>(queryKey || 'status');
  const [open, setOpen] = useState(false);

  return (
    <SelectProjectStatusProvider
      value={status as string}
      onValueChange={(value) => {
        setStatus(value);
        setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'status'}>
            <SelectProjectStatusValue />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <SelectProjectStatusContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectProjectStatusProvider>
  );
};

const SelectProjectStatusRoot = ({
  value,
  variant,
  scope,
  onValueChange,
}: {
  value?: string;
  variant: `${SelectTriggerVariant}`;
  scope?: string;
  onValueChange?: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  const handleValueChange = (value: string) => {
    onValueChange?.(value);
    setOpen(false);
  };

  return (
    <SelectProjectStatusProvider
      value={value}
      onValueChange={handleValueChange}
      variant={variant}
    >
      <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
        <SelectTriggerOperation variant={variant}>
          <SelectProjectStatusValue />
        </SelectTriggerOperation>
        <SelectOperationContent variant={variant}>
          <SelectProjectStatusContent />
        </SelectOperationContent>
      </PopoverScoped>
    </SelectProjectStatusProvider>
  );
};

export const SelectProjectStatus = Object.assign(SelectProjectStatusRoot, {
  FilterView: SelectProjectStatusFilterView,
  FilterBar: SelectProjectStatusFilterBar,
});
