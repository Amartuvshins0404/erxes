import { Icon, IconCheck, IconX } from '@tabler/icons-react';
import {
  Combobox,
  Command,
  Popover,
  Filter,
  useFilterContext,
  useQueryState,
  Toggle,
} from 'erxes-ui';
import { useState } from 'react';
import { useFilters } from '~/hooks/useFilters';

export const FilterSelectContent = ({
  selectOptions,
  onSelect,
  selected,
  fieldLabel,
}: {
  selectOptions: { value: string; label: string }[];
  onSelect: (value: string) => void;
  selected: string;
  fieldLabel: string;
}) => {
  return (
    <Command>
      <Command.Input
        placeholder={`Search ${fieldLabel}...`}
        variant="secondary"
        className="bg-background"
        focusOnMount
      />
      <Command.List>
        {selectOptions.map((option) => (
          <Command.Item
            key={option.value}
            value={option.value}
            onSelect={() => onSelect(option.value)}
          >
            {option.label}
            <Combobox.Check checked={selected === option.value} />
          </Command.Item>
        ))}
      </Command.List>
    </Command>
  );
};

export const SelectFilterBar = ({
  filterKey,
  selectOptions,
  icon,
  fieldLabel,
}: {
  filterKey: string;
  selectOptions: { value: string; label: string }[];
  icon: React.ReactNode;
  fieldLabel: string;
}) => {
  const [_value, setValue] = useQueryState<string>(filterKey);
  const { resetFilterState } = useFilterContext();
  const [open, setOpen] = useState(false);

  const value = String(_value);

  return (
    <Filter.BarItem queryKey={filterKey}>
      <Filter.BarName>
        {icon}
        {fieldLabel}
      </Filter.BarName>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Filter.BarButton>
            <Combobox.Value
              placeholder={`Search ${fieldLabel}...`}
              value={
                value
                  ? selectOptions.find((option) => option.value === value)
                      ?.label
                  : undefined
              }
            />
          </Filter.BarButton>
        </Popover.Trigger>
        <Combobox.Content>
          <FilterSelectContent
            fieldLabel={fieldLabel}
            selectOptions={selectOptions}
            onSelect={(value) => {
              setValue(value);
              setOpen(false);
              resetFilterState();
            }}
            selected={value || ''}
          />
        </Combobox.Content>
      </Popover>
    </Filter.BarItem>
  );
};

export const BooleanFilterBar = ({
  filterKey,
  icon,
  fieldLabel,
}: {
  filterKey: string;
  icon: React.ReactNode;
  fieldLabel: string;
}) => {
  const [value, setValue] = useQueryState<boolean>(filterKey);
  const { resetFilterState } = useFilterContext();
  return (
    <Filter.BarItem queryKey={filterKey}>
      <Filter.BarName>
        {icon}
        {fieldLabel}
      </Filter.BarName>
      <Filter.BarButton
        onClick={() => {
          setValue(value ? false : true);
          resetFilterState();
        }}
      >
        {value ? <IconCheck /> : <IconX />}{' '}
        <span className="capitalize">{String(value)}</span>
      </Filter.BarButton>
    </Filter.BarItem>
  );
};

export const BooleanFilterView = ({ filterKey }: { filterKey: string }) => {
  const [value, setValue] = useQueryState<string>(filterKey);
  const { resetFilterState } = useFilterContext();
  return (
    <Filter.View filterKey={filterKey}>
      <Command>
        <Command.Input
          placeholder="Search boolean..."
          variant="secondary"
          className="opacity-0 bt:h-0 overflow-hidden"
          wrapperClassName="opacity-0 h-0 overflow-hidden"
          focusOnMount
        />
        <Command.List className="p-1">
          {['true', 'false'].map((boolean) => (
            <Command.Item
              key={boolean}
              value={boolean}
              onSelect={() => {
                setValue(boolean);
                resetFilterState();
              }}
            >
              {boolean === 'true' ? <IconCheck /> : <IconX />}{' '}
              <span className="capitalize">{boolean}</span>
              <Combobox.Check checked={value === boolean} />
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </Filter.View>
  );
};

export const SelectFilterView = ({
  filterKey,
  selectOptions,
  fieldLabel,
}: {
  filterKey: string;
  selectOptions: { value: string; label: string }[];
  fieldLabel: string;
}) => {
  const [value, setValue] = useQueryState<string>(filterKey);
  const { resetFilterState } = useFilterContext();
  return (
    <Filter.View filterKey={filterKey}>
      <FilterSelectContent
        fieldLabel={fieldLabel}
        selectOptions={selectOptions}
        onSelect={(value) => {
          setValue(value);
          resetFilterState();
        }}
        selected={value || ''}
      />
    </Filter.View>
  );
};

export interface ListFilterItem {
  filterKey: string;
  label: string;
  icon: Icon;
  type: 'select' | 'text' | 'relation' | 'boolean';
  selectOptions?: { value: string; label: string }[];
  filterBar?: React.ReactNode;
  filterView?: React.ReactNode;
}

export const ListFilter = ({
  filters,
  scope,
}: {
  filters: ListFilterItem[];
  scope: string;
}) => {
  const { queries, hasFilters } = useFilters(filters);

  return (
    <Filter id={`${scope}-filter`}>
      <Filter.Bar>
        {filters.map((filter) => {
          if (filter.type === 'select') {
            return (
              <SelectFilterBar
                key={filter.filterKey}
                filterKey={filter.filterKey}
                selectOptions={filter.selectOptions || []}
                icon={<filter.icon />}
                fieldLabel={filter.label}
              />
            );
          }

          if (filter.type === 'relation') {
            return filter.filterBar;
          }

          if (filter.type === 'text') {
            return (
              <Filter.BarItem queryKey={filter.filterKey}>
                <Filter.BarName>
                  <filter.icon />
                  {filter.label}
                </Filter.BarName>
                <Filter.BarButton filterKey={filter.filterKey}>
                  {queries[filter.filterKey as keyof typeof queries] as string}
                </Filter.BarButton>
              </Filter.BarItem>
            );
          }

          if (filter.type === 'boolean') {
            return (
              <BooleanFilterBar
                filterKey={filter.filterKey}
                icon={<filter.icon />}
                fieldLabel={filter.label}
              />
            );
          }

          return null;
        })}
        <Filter.Popover scope={scope}>
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
                  {filters.map((filter) => (
                    <Filter.Item
                      key={filter.filterKey}
                      value={filter.filterKey}
                      inDialog={filter.type === 'text'}
                    >
                      <filter.icon />
                      {filter.label}
                    </Filter.Item>
                  ))}
                </Command.List>
              </Command>
            </Filter.View>
            {filters.map((filter) => {
              if (filter.type === 'select') {
                return (
                  <SelectFilterView
                    key={filter.filterKey}
                    filterKey={filter.filterKey}
                    selectOptions={filter.selectOptions || []}
                    fieldLabel={filter.label}
                  />
                );
              }
              if (filter.type === 'relation') {
                return filter.filterView;
              }
              if (filter.type === 'boolean') {
                return <BooleanFilterView filterKey={filter.filterKey} />;
              }
              return null;
            })}
          </Combobox.Content>
        </Filter.Popover>
        <Filter.Dialog>
          {filters.map((filter) => {
            if (filter.type === 'text') {
              return (
                <Filter.View filterKey={filter.filterKey} inDialog>
                  <Filter.DialogStringView
                    filterKey={filter.filterKey}
                    label={filter.label}
                  />
                </Filter.View>
              );
            }
            return null;
          })}
        </Filter.Dialog>
      </Filter.Bar>
    </Filter>
  );
};
