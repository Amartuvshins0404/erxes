import { Select } from 'erxes-ui';
import { MtoFilterBase } from '~/components/MtoFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { CategoryFilters as CategoryFiltersType } from '@/category/types/categoryFilters';

const ACTIVE_OPTIONS = [
  { value: '__all__', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const LEVEL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'main', label: 'Main' },
  { value: 'sub', label: 'Sub' },
];

interface CategoryFiltersProps {
  filters: CategoryFiltersType;
  onFiltersChange: (filters: CategoryFiltersType) => void;
}

export function CategoryFilters({
  filters,
  onFiltersChange,
}: CategoryFiltersProps) {
  return (
    <MtoFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Level">
        <Select
          value={filters.level ?? 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              level: value as CategoryFiltersType['level'],
            })
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            {LEVEL_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Status">
        <Select
          value={
            filters.isActive === undefined ? '__all__' : String(filters.isActive)
          }
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              isActive: value === '__all__' ? undefined : value === 'true',
            })
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            {ACTIVE_OPTIONS.map((option) => (
              <Select.Item key={option.value} value={option.value}>
                {option.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
    </MtoFilterBase>
  );
}
