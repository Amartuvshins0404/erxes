import { useSupplierDetail } from '@/supplier/hooks/useSupplierDetail';
import { useSuppliers } from '@/supplier/hooks/useSuppliers';
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
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'use-debounce';

interface ISupplier {
  _id: string;
  name?: string;
}

interface SelectSupplierContextType {
  value?: string;
  onValueChange: (value: ISupplier) => void;
  variant?: `${SelectTriggerVariant}`;
  selectedSuppliers: ISupplier[];
  contentSuppliers: ISupplier[];
  search: string;
  setSearch: (search: string) => void;
  setSelectedSuppliers: (suppliers: ISupplier[]) => void;
  handleFetchMore: () => void;
  totalCount?: number;
}

const SelectSupplierContext =
  React.createContext<SelectSupplierContextType | null>(null);

const useSelectSupplierContext = () => {
  const context = React.useContext(SelectSupplierContext);
  if (!context) {
    throw new Error(
      'useSelectSupplierContext must be used within SelectSupplierProvider',
    );
  }
  return context;
};

export const SelectSupplierProvider = ({
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
  const [selectedSuppliers, setSelectedSuppliers] = useState<ISupplier[]>([]);
  const [search, setSearch] = useState('');

  const [debouncedSearch] = useDebounce(search, 500);

  const { suppliers = [], handleFetchMore, totalCount } = useSuppliers({
    variables: { searchValue: debouncedSearch },
  });

  useEffect(() => {
    if (!value) return;

    const selected = suppliers.filter((s) => s._id === value);
    if (selected.length) {
      setSelectedSuppliers(selected);
    }
  }, [suppliers, value]);

  const selectedIds = new Set(selectedSuppliers.map((s) => s._id));
  const contentSuppliers = suppliers.filter((s) => !selectedIds.has(s._id));

  const handleValueChange = (supplier: ISupplier) => {
    if (!supplier) return;
    onValueChange(supplier._id);
  };

  return (
    <SelectSupplierContext.Provider
      value={{
        selectedSuppliers,
        contentSuppliers,
        value,
        onValueChange: handleValueChange,
        variant,
        search,
        setSearch,
        setSelectedSuppliers,
        handleFetchMore,
        totalCount,
      }}
    >
      {children}
    </SelectSupplierContext.Provider>
  );
};

const SelectSupplierValue = ({ placeholder }: { placeholder?: string }) => {
  const { t } = useTranslation('mushop');
  const {
    value,
    contentSuppliers,
    selectedSuppliers,
    setSelectedSuppliers,
  } = useSelectSupplierContext();

  const selectedSupplier =
    selectedSuppliers?.find((s) => s._id === value) ||
    contentSuppliers.find((s) => s._id === value);

  const { supplier: supplierDetail } = useSupplierDetail(
    selectedSupplier ? undefined : value,
  );

  useEffect(() => {
    if (supplierDetail) {
      setSelectedSuppliers([supplierDetail]);
    }
  }, [supplierDetail, setSelectedSuppliers]);

  if (!value) {
    return (
      <span className="text-accent-foreground/80">
        {placeholder || t('Select supplier...')}
      </span>
    );
  }

  return <>{selectedSupplier?.name || supplierDetail?.name}</>;
};

const SelectSupplierCommandItem = ({ supplier }: { supplier: ISupplier }) => {
  const { onValueChange, value } = useSelectSupplierContext();

  return (
    <Command.Item
      value={supplier._id}
      key={supplier._id}
      onSelect={() => onValueChange(supplier)}
    >
      {supplier.name}
      <Combobox.Check checked={value === supplier._id} />
    </Command.Item>
  );
};

const SelectSupplierContent = () => {
  const { t } = useTranslation('mushop');
  const {
    selectedSuppliers = [],
    contentSuppliers = [],
    search,
    setSearch,
    handleFetchMore,
    totalCount,
  } = useSelectSupplierContext();

  return (
    <Command id="supplier-command-menu">
      <Command.Input
        placeholder={t('Search supplier...')}
        value={search}
        onValueChange={setSearch}
      />
      <Command.List>
        <Command.Empty>{t('No supplier found')}</Command.Empty>
        {!!selectedSuppliers?.length && (
          <>
            {selectedSuppliers.map((supplier) => (
              <SelectSupplierCommandItem key={supplier._id} supplier={supplier} />
            ))}
            <Command.Separator className="my-1" />
          </>
        )}
        {contentSuppliers.map((supplier) => (
          <SelectSupplierCommandItem key={supplier._id} supplier={supplier} />
        ))}
        <Combobox.FetchMore
          fetchMore={handleFetchMore}
          currentLength={
            (contentSuppliers?.length || 0) + (selectedSuppliers?.length || 0)
          }
          totalCount={totalCount || 0}
        />
      </Command.List>
    </Command>
  );
};

const SelectSupplierFilterView = ({ queryKey }: { queryKey?: string }) => {
  const [supplierId, setSupplierId] = useQueryState<string>(
    queryKey || 'supplierId',
  );
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey={queryKey || 'supplierId'}>
      <SelectSupplierProvider
        value={supplierId as string}
        onValueChange={(value) => {
          setSupplierId(value);
          resetFilterState();
        }}
      >
        <SelectSupplierContent />
      </SelectSupplierProvider>
    </Filter.View>
  );
};

const SelectSupplierFilterBar = ({ queryKey }: { queryKey?: string }) => {
  const [supplierId, setSupplierId] = useQueryState<string>(
    queryKey || 'supplierId',
  );
  const [open, setOpen] = useState(false);

  return (
    <SelectSupplierProvider
      value={supplierId as string}
      onValueChange={(value) => {
        setSupplierId(value);
        setOpen(false);
      }}
    >
      <PopoverScoped open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton filterKey={queryKey || 'supplierId'}>
            <SelectSupplierValue />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <SelectSupplierContent />
        </Combobox.Content>
      </PopoverScoped>
    </SelectSupplierProvider>
  );
};

const SelectSupplierRoot = ({
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
    <SelectSupplierProvider
      value={value}
      onValueChange={handleValueChange}
      variant={variant}
    >
      <PopoverScoped scope={scope} open={open} onOpenChange={setOpen}>
        <SelectTriggerOperation variant={variant}>
          <SelectSupplierValue />
        </SelectTriggerOperation>
        <SelectOperationContent variant={variant}>
          <SelectSupplierContent />
        </SelectOperationContent>
      </PopoverScoped>
    </SelectSupplierProvider>
  );
};

export const SelectSupplier = Object.assign(SelectSupplierRoot, {
  FilterView: SelectSupplierFilterView,
  FilterBar: SelectSupplierFilterBar,
});
