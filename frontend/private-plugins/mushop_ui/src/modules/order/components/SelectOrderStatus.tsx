import {
  Combobox,
  Command,
  Filter,
  Popover,
  PopoverScoped,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ORDER_STATUSES } from '../types';

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  forwarded: 'Forwarded',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

interface Ctx {
  value?: string;
  onValueChange: (value: string) => void;
}

const SelectOrderStatusContext = React.createContext<Ctx | null>(null);

const useCtx = () => {
  const c = React.useContext(SelectOrderStatusContext);
  if (!c) throw new Error('SelectOrderStatus context missing');
  return c;
};

const Provider = ({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
}) => (
  <SelectOrderStatusContext.Provider value={{ value, onValueChange }}>
    {children}
  </SelectOrderStatusContext.Provider>
);

const Value = ({ placeholder }: { placeholder?: string }) => {
  const { t } = useTranslation('mushop');
  const { value } = useCtx();
  if (!value)
    return (
      <span className="text-accent-foreground/80">
        {placeholder || t('Select status...')}
      </span>
    );
  return <>{t(ORDER_STATUS_LABELS[value] || value)}</>;
};

const Item = ({ status }: { status: string }) => {
  const { t } = useTranslation('mushop');
  const { value, onValueChange } = useCtx();
  return (
    <Command.Item
      value={status}
      onSelect={() => onValueChange(value === status ? '' : status)}
    >
      {t(ORDER_STATUS_LABELS[status] || status)}
      <Combobox.Check checked={value === status} />
    </Command.Item>
  );
};

const Content = () => {
  const { t } = useTranslation('mushop');
  return (
    <Command id="order-status-command-menu">
      <Command.Input placeholder={t('Select status')} />
      <Command.List>
        <Command.Empty>{t('No status found')}</Command.Empty>
        {ORDER_STATUSES.map((status) => (
          <Item key={status} status={status} />
        ))}
      </Command.List>
    </Command>
  );
};

const FilterView = ({ queryKey }: { queryKey?: string }) => {
  const [value, setValue] = useQueryState<string>(queryKey || 'status');
  const { resetFilterState } = useFilterContext();
  return (
    <Filter.View filterKey={queryKey || 'status'}>
      <Provider
        value={value as string}
        onValueChange={(v) => {
          setValue(v);
          resetFilterState();
        }}
      >
        <Content />
      </Provider>
    </Filter.View>
  );
};

const FilterBar = ({ queryKey }: { queryKey?: string }) => {
  const [value, setValue] = useQueryState<string>(queryKey || 'status');
  const [open, setOpen] = useState(false);
  return (
    <Provider
      value={value as string}
      onValueChange={(v) => {
        setValue(v);
        setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'status'}>
            <Value />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <Content />
        </Combobox.Content>
      </PopoverScoped>
    </Provider>
  );
};

export const SelectOrderStatus = {
  FilterView,
  FilterBar,
};
