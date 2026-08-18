import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Combobox,
  Command,
  Filter,
  Popover,
  PopoverScoped,
  useFilterContext,
  useQueryState,
} from 'erxes-ui';
import { useCoreProductCategories } from '../hooks/useAssignProductCategory';
import { IMushopProductCategory } from '../types';

interface Ctx {
  value?: string;
  onValueChange: (value: string | null) => void;
}

const Context = React.createContext<Ctx | null>(null);
const useCtx = () => {
  const c = React.useContext(Context);
  if (!c) throw new Error('SelectProductCategory context missing');
  return c;
};

const Provider = ({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string | null) => void;
}) => (
  <Context.Provider value={{ value, onValueChange }}>
    {children}
  </Context.Provider>
);

const Content = () => {
  const { t } = useTranslation('mushop');
  const { value, onValueChange } = useCtx();
  const [search, setSearch] = useState('');
  const { categories, loading } = useCoreProductCategories(search || undefined);

  return (
    <Command shouldFilter={false}>
      <Command.Input
        placeholder={t('Search categories...')}
        value={search}
        onValueChange={setSearch}
      />
      <Command.List>
        {loading && <Command.Item disabled>{t('Loading...')}</Command.Item>}
        <Command.Empty>{t('No categories found.')}</Command.Empty>
        {categories.map((cat: IMushopProductCategory) => (
          <Command.Item
            key={cat._id}
            value={cat._id}
            onSelect={() => onValueChange(value === cat._id ? null : cat._id!)}
          >
            {cat.name}
            <Combobox.Check checked={cat._id === value} />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
};

const FilterView = ({ queryKey = 'categoryId' }: { queryKey?: string }) => {
  const [value, setValue] = useQueryState<string>(queryKey);
  const { resetFilterState } = useFilterContext();
  return (
    <Filter.View filterKey={queryKey}>
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

const FilterBar = ({ queryKey = 'categoryId' }: { queryKey?: string }) => {
  const { t } = useTranslation('mushop');
  const [value, setValue] = useQueryState<string>(queryKey);
  const [open, setOpen] = useState(false);
  const { categories } = useCoreProductCategories();
  const selected = categories.find((c: IMushopProductCategory) => c._id === value);

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
          <Filter.BarButton filterKey={queryKey}>
            {selected?.name ?? (
              <span className="text-accent-foreground/80">{t('Select category...')}</span>
            )}
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <Content />
        </Combobox.Content>
      </PopoverScoped>
    </Provider>
  );
};

export const SelectProductCategory = {
  FilterView,
  FilterBar,
};
