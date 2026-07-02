import { Select } from 'erxes-ui';
import { FilterField } from '~/components/shared/FilterField';
import { EventFilters as EventFiltersType } from '@/event/types/eventFilters';
import { useEventCategoryOptions } from '@/event/hooks/useEventCategoryOptions';

interface EventCategoryFiltersProps {
  filters: EventFiltersType;
  onFiltersChange: (filters: EventFiltersType) => void;
}

export function EventCategoryFilters({
  filters,
  onFiltersChange,
}: EventCategoryFiltersProps) {
  const { mainCategories, getAssociationLabel } = useEventCategoryOptions();

  return (
    <FilterField label="Category">
      <Select
        value={filters.categoryId ?? '__all__'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            categoryId: value === '__all__' ? undefined : value,
          })
        }
      >
        <Select.Trigger>
          <Select.Value placeholder="All" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="__all__">All</Select.Item>
          {mainCategories.map((category) => (
            <Select.Item key={category._id} value={category._id}>
              {getAssociationLabel(category)}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </FilterField>
  );
}
