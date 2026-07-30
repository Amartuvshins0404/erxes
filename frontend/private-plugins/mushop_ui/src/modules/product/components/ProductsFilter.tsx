import {
  IconCategory,
  IconProgress,
  IconSearch,
  IconTruck,
} from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { SelectSupplier } from '@/supplier/components/select/SelectSupplier';
import { SelectProductStatus } from './SelectProductStatus';
import { SelectProductCategory } from './SelectProductCategory';

const ProductsFilterPopover = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    supplierId: string;
    categoryId: string;
  }>(['searchValue', 'status', 'supplierId', 'categoryId']);

  const hasFilters = Object.values(queries || {}).some((v) => v !== null);

  return (
    <>
      <Filter.Popover>
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder={t('Filter')}
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  {t('Search')}
                </Filter.Item>
                <Filter.Item value="status">
                  <IconProgress />
                  {t('Status')}
                </Filter.Item>
                <Filter.Item value="supplierId">
                  <IconTruck />
                  {t('Supplier')}
                </Filter.Item>
                <Filter.Item value="categoryId">
                  <IconCategory />
                  {t('Category')}
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <SelectProductStatus.FilterView />
          <SelectSupplier.FilterView />
          <SelectProductCategory.FilterView />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const ProductsFilter = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{
    searchValue: string;
    supplierId: string;
    categoryId: string;
  }>(['searchValue', 'supplierId', 'categoryId']);

  return (
    <Filter id="products-filter">
      <Filter.Bar>
        <Filter.BarItem queryKey="searchValue">
          <Filter.BarName>
            <IconSearch />
            {t('Search')}
          </Filter.BarName>
          <Filter.BarButton filterKey="searchValue" inDialog>
            {queries?.searchValue || ''}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgress />
            {t('Status')}
          </Filter.BarName>
          <SelectProductStatus.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="supplierId">
          <Filter.BarName>
            <IconTruck />
            {t('Supplier')}
          </Filter.BarName>
          <SelectSupplier.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="categoryId">
          <Filter.BarName>
            <IconCategory />
            {t('Category')}
          </Filter.BarName>
          <SelectProductCategory.FilterBar />
        </Filter.BarItem>
        <ProductsFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
