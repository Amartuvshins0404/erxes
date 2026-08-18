import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Combobox,
  Command,
  Popover,
  PopoverScoped,
  RecordTableInlineCell,
} from 'erxes-ui';
import { usePermissionCheck } from 'ui-modules';
import {
  useCoreProductCategories,
  useAssignProductCategory,
} from '../hooks/useAssignProductCategory';
import { IMushopProductCategory } from '../types';

interface Props {
  productId: string;
  categoryId?: string;
  category?: IMushopProductCategory;
  initialCategory?: IMushopProductCategory;
}

interface Ctx extends Props {
  open: boolean;
  setOpen: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
}

const Context = React.createContext<Ctx | null>(null);

const useCtx = () => {
  const c = React.useContext(Context);
  if (!c) throw new Error('ProductCategoryAssign context missing');
  return c;
};

const Content = () => {
  const { t } = useTranslation('mushop');
  const { productId, categoryId, search, setSearch, setOpen } = useCtx();
  const { categories, loading } = useCoreProductCategories(search || undefined);
  const { assign } = useAssignProductCategory();

  const handleSelect = (selectedId: string) => {
    const newId = selectedId === categoryId ? null : selectedId;
    assign({ variables: { _id: productId, categoryId: newId } });
    setOpen(false);
  };

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
        <Command.Group>
          {categoryId && (
            <Command.Item
              onSelect={() => {
                assign({ variables: { _id: productId, categoryId: null } });
                setOpen(false);
              }}
            >
              <span className="text-muted-foreground">{t('Clear category')}</span>
            </Command.Item>
          )}
          {categories.map((cat) => (
            <Command.Item
              key={cat._id}
              value={cat._id}
              onSelect={() => cat._id && handleSelect(cat._id)}
            >
              {cat.name}
              <Combobox.Check checked={cat._id === categoryId} />
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command>
  );
};

const InlineCell = () => {
  const { t } = useTranslation('mushop');
  const { categoryId, category, initialCategory, open, setOpen } = useCtx();
  const { hasActionPermission } = usePermissionCheck();
  const canAssign = hasActionPermission('mushopAssignProductCategory');
  const displayValue = category?.name ?? initialCategory?.name;

  if (!canAssign) {
    return (
      <RecordTableInlineCell>
        {displayValue ? (
          <span
            className={`${!categoryId && 'text-muted-foreground'}`}
          >
            {displayValue}
          </span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </RecordTableInlineCell>
    );
  }

  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <RecordTableInlineCell>
          {displayValue ? <span className={`${!categoryId && 'text-muted-foreground'}`}>{displayValue}</span> : (
            <span className="text-muted-foreground/60">{t('Assign category...')}</span>
          )}
        </RecordTableInlineCell>
      </Popover.Trigger>
      <Combobox.Content>
        <Content />
      </Combobox.Content>
    </PopoverScoped>
  );
};

const DetailTrigger = () => {
  const { t } = useTranslation('mushop');
  const { category, initialCategory, open, setOpen } = useCtx();
  const { hasActionPermission } = usePermissionCheck();
  const canAssign = hasActionPermission('mushopAssignProductCategory');
  const displayValue = category?.name;
  const placeholder = initialCategory?.name
    ? t('From supplier: {{name}}', { name: initialCategory.name })
    : t('Assign category...');

  if (!canAssign) {
    return (
      <span className="text-sm">
        {displayValue ?? (
          <span className="text-muted-foreground">
            {initialCategory?.name
              ? t('From supplier: {{name}}', { name: initialCategory.name })
              : '—'}
          </span>
        )}
      </span>
    );
  }

  return (
    <PopoverScoped open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="text-sm text-left w-full cursor-pointer">
          {displayValue ?? (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </button>
      </Popover.Trigger>
      <Combobox.Content>
        <Content />
      </Combobox.Content>
    </PopoverScoped>
  );
};

const Provider = ({ children, ...props }: Props & { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <Context.Provider value={{ ...props, open, setOpen, search, setSearch }}>
      <Popover open={open} onOpenChange={setOpen}>
        {children}
      </Popover>
    </Context.Provider>
  );
};

export const ProductCategoryAssign = {
  Provider,
  InlineCell,
  DetailTrigger,
};
