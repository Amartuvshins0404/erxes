import {
  IconCalendarClock,
  IconCalendarTime,
  IconCategory,
  IconCheck,
  IconProgress,
  IconSearch,
} from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  useFilterContext,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';
import { useEventCategoryOptions } from '@/event/hooks/useEventCategoryOptions';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const EventStatusFilterView = () => {
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

const EventActiveFilterView = () => {
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

const EventCategoryFilterView = () => {
  const [categoryId, setCategoryId] = useQueryState<string>('categoryId');
  const { resetFilterState } = useFilterContext();
  const { mainCategories, getCategoryLabel } = useEventCategoryOptions();

  return (
    <Filter.View filterKey="categoryId">
      <Command>
        <Command.Input placeholder="Search categories" />
        <Command.List className="p-1">
          <Command.Empty>No categories found</Command.Empty>
          {mainCategories.map((category) => (
            <Command.Item
              key={category._id}
              value={getCategoryLabel(category)}
              onSelect={() => {
                void setCategoryId(
                  categoryId === category._id ? null : category._id,
                );
                resetFilterState();
              }}
            >
              {getCategoryLabel(category)}
              {categoryId === category._id && <IconCheck className="ml-auto" />}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const EventFiltersPopover = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    isActive: string;
    categoryId: string;
    startDateFrom: string;
    startDateTo: string;
  }>([
    'searchValue',
    'status',
    'isActive',
    'categoryId',
    'startDateFrom',
    'startDateTo',
  ]);

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
                  Publish status
                </Filter.Item>
                <Filter.Item value="isActive">
                  <IconProgress />
                  Active
                </Filter.Item>
                <Filter.Item value="categoryId">
                  <IconCategory />
                  Category
                </Filter.Item>
                <Filter.Item value="startDateFrom">
                  <IconCalendarClock />
                  Start date from
                </Filter.Item>
                <Filter.Item value="startDateTo">
                  <IconCalendarTime />
                  Start date to
                </Filter.Item>
              </Command.List>
            </Command>
          </Filter.View>
          <EventStatusFilterView />
          <EventActiveFilterView />
          <EventCategoryFilterView />
          <Filter.View filterKey="startDateFrom">
            <Filter.DateView filterKey="startDateFrom" />
          </Filter.View>
          <Filter.View filterKey="startDateTo">
            <Filter.DateView filterKey="startDateTo" />
          </Filter.View>
        </Combobox.Content>
      </Filter.Popover>
      <Filter.Dialog>
        <Filter.View filterKey="searchValue" inDialog>
          <Filter.DialogStringView filterKey="searchValue" />
        </Filter.View>
        <Filter.View filterKey="startDateFrom" inDialog>
          <Filter.DialogDateView filterKey="startDateFrom" />
        </Filter.View>
        <Filter.View filterKey="startDateTo" inDialog>
          <Filter.DialogDateView filterKey="startDateTo" />
        </Filter.View>
      </Filter.Dialog>
    </>
  );
};

export const EventFilters = () => {
  const [queries] = useMultiQueryState<{
    searchValue: string;
    status: string;
    isActive: string;
    categoryId: string;
  }>(['searchValue', 'status', 'isActive', 'categoryId']);
  const { mainCategories, getCategoryLabel } = useEventCategoryOptions();

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === queries?.status)?.label ??
    queries?.status;
  const activeLabel =
    ACTIVE_OPTIONS.find((option) => option.value === queries?.isActive)
      ?.label ?? queries?.isActive;
  const categoryLabel = mainCategories.find(
    (category) => category._id === queries?.categoryId,
  );

  return (
    <Filter id="events-filter">
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
            Publish status
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
        <Filter.BarItem queryKey="categoryId">
          <Filter.BarName>
            <IconCategory />
            Category
          </Filter.BarName>
          <Filter.BarButton filterKey="categoryId">
            {categoryLabel ? getCategoryLabel(categoryLabel) : queries?.categoryId}
          </Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="startDateFrom">
          <Filter.BarName>
            <IconCalendarClock />
            Start date from
          </Filter.BarName>
          <Filter.Date filterKey="startDateFrom" />
        </Filter.BarItem>
        <Filter.BarItem queryKey="startDateTo">
          <Filter.BarName>
            <IconCalendarTime />
            Start date to
          </Filter.BarName>
          <Filter.Date filterKey="startDateTo" />
        </Filter.BarItem>
        <EventFiltersPopover />
      </Filter.Bar>
    </Filter>
  );
};
