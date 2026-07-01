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

const MEMBER_STATUS: Record<string, { text: string }> = {
  active: { text: 'Active' },
  paused: { text: 'Paused' },
  suspended: { text: 'Suspended' },
  expired: { text: 'Expired' },
  cancelled: { text: 'Cancelled' },
};

interface Ctx {
  value?: string;
  onValueChange: (value: string) => void;
}

const SelectMemberStatusContext = React.createContext<Ctx | null>(null);

const useCtx = () => {
  const c = React.useContext(SelectMemberStatusContext);
  if (!c) throw new Error('SelectMemberStatus context missing');
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
  <SelectMemberStatusContext.Provider value={{ value, onValueChange }}>
    {children}
  </SelectMemberStatusContext.Provider>
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
  return <>{MEMBER_STATUS[value]?.text ? t(MEMBER_STATUS[value].text) : value}</>;
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
    <Command id="member-status-command-menu">
      <Command.Input placeholder={t('Select status')} />
      <Command.List>
        <Command.Empty>{t('No status found')}</Command.Empty>
        {Object.entries(MEMBER_STATUS).map(([key, s]) => (
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

const statusVariant = (status?: string) => {
  if (status === 'active') return 'success';
  if (status === 'paused') return 'warning';
  if (status === 'suspended') return 'destructive';
  if (status === 'expired') return 'destructive';
  return 'secondary';
};

export const SelectMemberStatus = {
  FilterView,
  FilterBar,
  statusVariant,
};
