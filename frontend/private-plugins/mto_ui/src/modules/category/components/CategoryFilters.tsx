import {
  IconCheck,
  IconLayersSubtract,
  IconProgress,
} from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Filter,
  useFilterContext,
  useMultiQueryState,
  useQueryState,
} from 'erxes-ui';

const LEVEL_OPTIONS = [
  { value: 'main', label: 'Main' },
  { value: 'sub', label: 'Sub' },
];

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const CategoryLevelFilterView = () => {
  const [level, setLevel] = useQueryState<string>('level');
  const { resetFilterState } = useFilterContext();

  return (
    <Filter.View filterKey="level">
      <Command>
        <Command.List className="p-1">
          {LEVEL_OPTIONS.map((option) => (
            <Command.Item
              key={option.value}
              value={option.value}
              onSelect={() => {
                void setLevel(level === option.value ? null : option.value);
                resetFilterState();
              }}
            >
              {option.label}
              {level === option.value && <IconCheck className="ml-auto" />}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

const CategoryActiveFilterView = () => {
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

const CategoryFiltersPopover = () => {
  const [queries] = useMultiQueryState<{
    level: string;
    isActive: string;
  }>(['level', 'isActive']);

  const hasFilters = Object.values(queries || {}).some((value) => value !== null);

  return (
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
              <Filter.Item value="level">
                <IconLayersSubtract />
                Level
              </Filter.Item>
              <Filter.Item value="isActive">
                <IconProgress />
                Status
              </Filter.Item>
            </Command.List>
          </Command>
        </Filter.View>
        <CategoryLevelFilterView />
        <CategoryActiveFilterView />
      </Combobox.Content>
    </Filter.Popover>
  );
};

export const CategoryFilters = () => {
  const [queries] = useMultiQueryState<{
    level: string;
    isActive: string;
  }>(['level', 'isActive']);

  const levelLabel =
    LEVEL_OPTIONS.find((option) => option.value === queries?.level)?.label ??
    queries?.level;
  const activeLabel =
    ACTIVE_OPTIONS.find((option) => option.value === queries?.isActive)
      ?.label ?? queries?.isActive;

  return (
    <Filter id="categories-filter">
      <Filter.Bar>
        <Filter.BarItem queryKey="level">
          <Filter.BarName>
            <IconLayersSubtract />
            Level
          </Filter.BarName>
          <Filter.BarButton filterKey="level">{levelLabel}</Filter.BarButton>
        </Filter.BarItem>
        <Filter.BarItem queryKey="isActive">
          <Filter.BarName>
            <IconProgress />
            Status
          </Filter.BarName>
          <Filter.BarButton filterKey="isActive">{activeLabel}</Filter.BarButton>
        </Filter.BarItem>
        <CategoryFiltersPopover />
      </Filter.Bar>
    </Filter>
  );
};
