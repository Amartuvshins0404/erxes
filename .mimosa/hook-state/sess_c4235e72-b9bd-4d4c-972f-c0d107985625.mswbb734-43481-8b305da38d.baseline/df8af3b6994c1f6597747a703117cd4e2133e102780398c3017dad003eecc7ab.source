import {
  IconCalendarPlus,
  IconProgress,
  IconSearch,
} from '@tabler/icons-react';
import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { SelectMemberStatus } from './SelectMemberStatus';

const MembersFilterPopover = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    created: string;
  }>(['searchValue', 'status', 'created']);

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
                <Filter.Item value="created">
                  <IconCalendarPlus />
                  {t('Created At')}
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <Filter.View filterKey="created">
            <Filter.DateView filterKey="created" />
          </Filter.View>
          <SelectMemberStatus.FilterView />
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
        <Filter.View filterKey="created" inDialog>
          <Filter.DialogDateView filterKey="created" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const MembersFilter = () => {
  const { t } = useTranslation('mushop');
  const [queries] = useMultiQueryState<{ searchValue: string }>([
    'searchValue',
  ]);

  return (
    <Filter id="members-filter">
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
          <SelectMemberStatus.FilterBar />
        </Filter.BarItem>
        <Filter.BarItem queryKey="created">
          <Filter.BarName>
            <IconCalendarPlus />
            {t('Created At')}
          </Filter.BarName>
          <Filter.Date filterKey="created" />
        </Filter.BarItem>
        <MembersFilterPopover />
      </Filter.Bar>
    </Filter>
  );
};
