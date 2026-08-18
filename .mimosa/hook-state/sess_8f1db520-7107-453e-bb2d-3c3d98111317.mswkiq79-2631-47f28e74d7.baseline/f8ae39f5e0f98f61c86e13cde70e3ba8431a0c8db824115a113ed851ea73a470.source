import { Combobox, Command, Filter, useMultiQueryState } from 'erxes-ui';
import { SelectArea } from './SelectArea';
import { AgenciesTotalCount } from './AgenciesTotalCount';

export const AgenciesFilter = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    city: string;
    district: string;
  }>(['searchValue', 'city', 'district']);

  const hasFilters = Object.values(queries || {}).some(
    (value) => value !== null,
  );

  return (
    <Filter id="ba-agencies-filter">
      <Filter.Bar>
        <Filter.Popover>
          <Filter.Trigger isFiltered={hasFilters} />
          <Combobox.Content>
            <Filter.View>
              <Command>
                <Filter.CommandInput placeholder="Filter" variant="secondary" />
                <Command.List>
                  <Filter.SearchValueTrigger />
                  <SelectArea.CityFilterItem />
                  <SelectArea.DistrictFilterItem />
                </Command.List>
              </Command>
            </Filter.View>
            <SelectArea.CityFilterView />
            <SelectArea.DistrictFilterView />
          </Combobox.Content>
        </Filter.Popover>

        <Filter.Dialog>
          <Filter.View filterKey="searchValue" inDialog>
            <Filter.DialogStringView filterKey="searchValue" label="Search" />
          </Filter.View>
        </Filter.Dialog>

        <Filter.SearchValueBarItem />
        <SelectArea.CityFilterChip />
        <SelectArea.DistrictFilterChip />
        <AgenciesTotalCount />
      </Filter.Bar>
    </Filter>
  );
};
