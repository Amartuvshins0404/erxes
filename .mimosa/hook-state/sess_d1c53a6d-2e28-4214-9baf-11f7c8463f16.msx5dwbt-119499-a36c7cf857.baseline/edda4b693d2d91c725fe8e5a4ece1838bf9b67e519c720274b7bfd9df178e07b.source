import { Input, Select } from 'erxes-ui';
import { CategoryFilters } from '../types/category';
import { NestedCategoryFilter } from './NestedCategoryFilter';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';

interface CategoryFiltersProps {
  filters: CategoryFilters;
  onFiltersChange: (filters: CategoryFilters) => void;
}

export const CategoryFiltersComponent = ({
  filters,
  onFiltersChange,
}: CategoryFiltersProps) => {
  const handleFilterChange = (key: keyof CategoryFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <OneFitFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Parent category">
        <NestedCategoryFilter
          variant="parent"
          value={filters.parentId}
          onChange={(parentId) => onFiltersChange({ ...filters, parentId })}
          id="onefit-category-filter-parent"
        />
      </FilterField>
      <FilterField label="Search">
        <Input
          value={filters.searchValue || ''}
          onChange={(e) => handleFilterChange('searchValue', e.target.value)}
          placeholder="Search by name or description"
        />
      </FilterField>
      <FilterField label="Name">
        <Input
          value={filters.name || ''}
          onChange={(e) => handleFilterChange('name', e.target.value)}
          placeholder="Filter by exact name"
        />
      </FilterField>
      <FilterField label="Status">
        <Select
          value={
            filters.isActive === undefined
              ? '__all__'
              : filters.isActive
              ? 'true'
              : 'false'
          }
          onValueChange={(value) =>
            handleFilterChange(
              'isActive',
              value === '__all__' ? undefined : value === 'true',
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All statuses" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All statuses</Select.Item>
            <Select.Item value="true">Active</Select.Item>
            <Select.Item value="false">Inactive</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
    </OneFitFilterBase>
  );
};
