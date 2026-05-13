import {
  Combobox,
  Command,
  Filter,
  PageSubHeader,
  useMultiQueryState,
} from 'erxes-ui';
import { BlockUnitStatus } from '../types/unit';
import { IconProgress, IconSearch } from '@tabler/icons-react';
import { SelectUnitStatuses } from './SelectUnitStatuses';

type StatusFilter = BlockUnitStatus | 'all';

type Props = {
  activeStatus: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
};

export default function UnitFilter({ activeStatus, onStatusChange }: Props) {
  const [queries, setQueries] = useMultiQueryState<{
    searchValue: string;
    statuses: string[];
    agencyId: string;
    memberId: string;
    projectId: string;
  }>(['searchValue', 'statuses', 'agencyId', 'memberId', 'projectId']);

  const hasFilters = Object.values(queries || {}).some(
    (value) => value !== null,
  );
  return (
    <PageSubHeader>
      <Filter id="unit-filter">
        <Filter.Bar>
          <Filter.BarItem queryKey="statuses">
            <Filter.BarName>
              <IconProgress />
            </Filter.BarName>
            <SelectUnitStatuses.FilterBar mode="multiple" />
          </Filter.BarItem>{' '}
          <Filter.Popover>
            <Filter.Trigger isFiltered={hasFilters} />
            <Combobox.Content>
              <Filter.View>
                <Command>
                  <Filter.CommandInput
                    placeholder="Filter"
                    variant="secondary"
                    className="bg-background"
                  />
                  <Command.List>
                    <Filter.Item value="searchValue" inDialog>
                      <IconSearch />
                      Search
                    </Filter.Item>
                    <Filter.Item value="statuses">
                      <IconProgress />
                      Status
                    </Filter.Item>
                  </Command.List>
                </Command>
              </Filter.View>
              <SelectUnitStatuses.FilterView mode="multiple" />
            </Combobox.Content>
          </Filter.Popover>
        </Filter.Bar>
      </Filter>
    </PageSubHeader>
  );
}
