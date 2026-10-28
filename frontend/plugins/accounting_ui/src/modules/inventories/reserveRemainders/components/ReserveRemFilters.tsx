import { STOCK_PLACE_CAPABILITY } from '@/utils/structure';
import { IconSearch } from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import {
  SelectStructureEntities,
  SelectCategory,
  SelectProduct,
} from 'ui-modules';
import { useTranslation } from 'react-i18next';
import { useReserveRemQueryParams } from '../hooks/useReserveRems';

const ReserveRemFilterPopover = () => {
  const { t } = useTranslation('accounting');
  const queryParams = useReserveRemQueryParams();
  const hasFilters = Object.values(queryParams || {}).some(
    (value) => value !== null && value !== undefined && value !== '',
  );

  return (
    <>
      <Filter.Popover scope="reserve-rems-filter">
        <Filter.Trigger isFiltered={hasFilters} />
        <Combobox.Content>
          <Filter.View>
            <Command>
              <Filter.CommandInput
                placeholder={t('filter')}
                variant="secondary"
                className="bg-background"
              />
              <Command.List className="p-1">
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  {t('search')}
                </Filter.Item>
                <SelectCategory.FilterItem
                  value="categoryId"
                  label={t('category')}
                />
                <SelectProduct.FilterItem
                  value="productId"
                  label={t('product')}
                />
                <SelectStructureEntities.FilterItem
                  value="placeEntityId"
                  label={t('place', 'Place')}
                />
              </Command.List>
            </Command>
          </Filter.View>
          <SelectCategory.FilterView filterKey="categoryId" mode="single" />
          <SelectProduct.FilterView filterKey="productId" mode="single" />
          <SelectStructureEntities.FilterView
            capability={STOCK_PLACE_CAPABILITY}
            mode="single"
            filterKey="placeEntityId"
          />
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

export const ReserveRemFilter = ({
  afterBar,
}: {
  afterBar?: React.ReactNode;
}) => {
  const { t } = useTranslation('accounting');
  const [queries] = useMultiQueryState<{
    searchValue: string;
  }>(['searchValue']);

  const { searchValue } = queries;

  return (
    <Filter id="reserve-rems-filter">
      <Filter.Bar>
        <ReserveRemFilterPopover />
        <Filter.BarItem queryKey="searchValue">
          <Filter.BarName>
            <IconSearch />
            {t('search')}
          </Filter.BarName>
          <Filter.BarButton filterKey="searchValue" inDialog>
            {searchValue}
          </Filter.BarButton>
        </Filter.BarItem>
        <SelectCategory.FilterBar
          filterKey="categoryId"
          label={t('category')}
          mode="single"
        />
        <SelectProduct.FilterBar
          filterKey="productId"
          label={t('product')}
          mode="single"
        />
        <SelectStructureEntities.FilterBar
          capability={STOCK_PLACE_CAPABILITY}
          label={t('place', 'Place')}
          filterKey="placeEntityId"
          mode="single"
        />
        {afterBar && <>{afterBar}</>}
      </Filter.Bar>
    </Filter>
  );
};
