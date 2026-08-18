import { IconProgress, IconSearch } from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { SelectProductStatus } from './SelectProductStatus';

const ProductsFilterPopover = () => {
  const { t } = useTranslation('blockadmin');
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
  }>(['searchValue', 'status']);

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
              </Command.List>
            </Command>
          </Filter.View>
          <SelectProductStatus.FilterView />
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
  const { t } = useTranslation('blockadmin');
  const [queries] = useMultiQueryState<{
    searchValue: string;
  }>(['searchValue']);

  return (
    <Filter id="ba-products-filter">
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
        <ProductsFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
