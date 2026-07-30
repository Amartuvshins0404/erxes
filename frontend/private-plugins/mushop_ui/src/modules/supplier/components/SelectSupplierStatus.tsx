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

const SUPPLIER_VERIFICATION_STATUS: Record<string, { text: string }> = {
  verified: { text: 'Verified' },
  unverified: { text: 'Unverified' },
  pending: { text: 'Pending' },
};

interface Ctx {
  value?: string;
  onValueChange: (value: string) => void;
}

const SelectSupplierStatusContext = React.createContext<Ctx | null>(null);

const useCtx = () => {
  const c = React.useContext(SelectSupplierStatusContext);
  if (!c) throw new Error('SelectSupplierStatus context missing');
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
  <SelectSupplierStatusContext.Provider value={{ value, onValueChange }}>
    {children}
  </SelectSupplierStatusContext.Provider>
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
  return (
    <>
      {SUPPLIER_VERIFICATION_STATUS[value]?.text
        ? t(SUPPLIER_VERIFICATION_STATUS[value].text)
        : value}
    </>
  );
};

const Item = ({ status, text }: { status: string; text: string }) => {
  const { t } = useTranslation('mushop');
  const { value, onValueChange } = useCtx();
  return (
    <Command.Item
      value={status}
      onSelect={() => onValueChange(value === status ? '' : status)}
    >
      {t(text)}
      <Combobox.Check checked={value === status} />
    </Command.Item>
  );
};

const Content = () => {
  const { t } = useTranslation('mushop');
  return (
    <Command id="supplier-status-command-menu">
      <Command.Input placeholder={t('Select status')} />
      <Command.List>
        <Command.Empty>{t('No status found')}</Command.Empty>
        {Object.entries(SUPPLIER_VERIFICATION_STATUS).map(([key, s]) => (
          <Item key={key} status={key} text={s.text} />
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

export const SelectSupplierStatus = {
  FilterView,
  FilterBar,
};
