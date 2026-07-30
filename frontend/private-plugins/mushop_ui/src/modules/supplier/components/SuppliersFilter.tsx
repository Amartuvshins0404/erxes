import {
  IconCalendarClock,
  IconCalendarPlus,
  IconProgress,
  IconSearch,
} from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { SelectSupplierStatus } from './SelectSupplierStatus';

const SuppliersFilterPopover = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    created: string;
    foundedAt: string;
  }>(['searchValue', 'status', 'created', 'foundedAt']);

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
                  {t('Verification')}
                </Filter.Item>
                <Filter.Item value="created">
                  <IconCalendarPlus />
                  {t('Created At')}
                </Filter.Item>
                <Filter.Item value="foundedAt">
                  <IconCalendarClock />
                  {t('Founded At')}
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <Filter.View filterKey="created">
            <Filter.DateView filterKey="created" />
          </Filter.View>
          <Filter.View filterKey="foundedAt">
            <Filter.DateView filterKey="foundedAt" />
          </Filter.View>
          <SelectSupplierStatus.FilterView />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
        <Filter.View filterKey="created" inDialog>
          <Filter.DialogDateView filterKey="created" />
        </Filter.View>
        <Filter.View filterKey="foundedAt" inDialog>
          <Filter.DialogDateView filterKey="foundedAt" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const SuppliersFilter = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{
    searchValue: string;
  }>(['searchValue']);

  return (
    <Filter id="suppliers-filter">
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
            {t('Verification')}
          </Filter.BarName>
          <SelectSupplierStatus.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="created">
          <Filter.BarName>
            <IconCalendarPlus />
            {t('Created At')}
          </Filter.BarName>
          <Filter.Date filterKey="created" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="foundedAt">
          <Filter.BarName>
            <IconCalendarClock />
            {t('Founded At')}
          </Filter.BarName>
          <Filter.Date filterKey="foundedAt" />
        </Filter.BarItem>
        <SuppliersFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
