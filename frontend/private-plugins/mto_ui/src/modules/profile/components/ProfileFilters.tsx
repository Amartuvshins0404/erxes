import { IconCheck, IconProgress, IconSearch } from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  useFilterContext,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import { PROFILES_CURSOR_SESSION_KEY } from '@/profile/constants/profilesCursorSessionKey';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const ProfileStatusFilterView = () => {
  const [status, setStatus] = useQueryState<string>('status');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="status">
      <Command>
        <Command.List className="p-1">
          {STATUS_OPTIONS.map((option) => (
            <Command.Item
              key={option.value}
              value={option.value}
              onSelect={() => {
                void setStatus(status === option.value ? null : option.value);
                resetFilterState();
              }}
            >
              {option.label}
              {status === option.value && <IconCheck className="ml-auto" />}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const ProfileActiveFilterView = () => {
  const [isActive, setIsActive] = useQueryState<string>('isActive');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="isActive">
      <Command>
        <Command.List className="p-1">
          {ACTIVE_OPTIONS.map((option) => (
            <Command.Item
              key={option.value}
              value={option.value}
              onSelect={() => {
                void setIsActive(
                  isActive === option.value ? null : option.value,
                );
                resetFilterState();
              }}
            >
              {option.label}
              {isActive === option.value && <IconCheck className="ml-auto" />}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const ProfileFiltersPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    isActive: string;
  }>(['searchValue', 'status', 'isActive']);

  const hasFilters = Object.values(queries || {}).some((value) => value !== null);

  return (
    <>
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
              <Command.List className="p-1">
                <Filter.Item value="searchValue" inDialog>
                  <IconSearch />
                  Search
                </Filter.Item>
                <Command.Separator className="my-1" />
                <Filter.Item value="status">
                  <IconProgress />
                  Status
                </Filter.Item>
                <Filter.Item value="isActive">
                  <IconProgress />
                  Active
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <ProfileStatusFilterView />
          <ProfileActiveFilterView />
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

export const ProfileFilters = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    isActive: string;
  }>(['searchValue', 'status', 'isActive']);

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === queries?.status)?.label ??
    queries?.status;
  const activeLabel =
    ACTIVE_OPTIONS.find((option) => option.value === queries?.isActive)
      ?.label ?? queries?.isActive;

  return (
    <Filter id="profiles-filter" sessionKey={PROFILES_CURSOR_SESSION_KEY}>
      <Filter.Bar>
        {queries?.searchValue && (
          <Filter.BarItem queryKey="searchValue">
            <Filter.BarName>
              <IconSearch />
              Search
            </Filter.BarName>
            <Filter.BarButton filterKey="searchValue" inDialog>
              {queries.searchValue}
            </Filter.BarButton>
          </Filter.BarItem>
        )}
        <Filter.BarItem queryKey="status">
          <Filter.BarName>
            <IconProgress />
            Status
          </Filter.BarName>
          <Filter.BarButton filterKey="status">{statusLabel}</Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="isActive">
          <Filter.BarName>
            <IconProgress />
            Active
          </Filter.BarName>
          <Filter.BarButton filterKey="isActive">{activeLabel}</Filter.BarButton>
        </Filter.BarItem>
        <ProfileFiltersPopover />
      </Filter.Bar>
    </Filter>
  );
};
