import { Input, Select } from 'erxes-ui';
import { ProviderFilters as ProviderFiltersType } from '../types/provider';
import { NestedCategoryFilter } from '~/modules/category/components/NestedCategoryFilter';
import { ProviderStatus } from '../types/provider';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';

interface ProviderFiltersProps {
  filters: ProviderFiltersType;
  onFiltersChange: (filters: ProviderFiltersType) => void;
}

export const ProviderFilters = ({
  filters,
  onFiltersChange,
}: ProviderFiltersProps) => {
  const handleFilterChange = (key: keyof ProviderFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]:
        value === null || value === undefined || value === ''
          ? undefined
          : value,
    });
  };

  return (
    <OneFitFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Search">
        <Input
          value={filters.searchValue || ''}
          onChange={(e) => handleFilterChange('searchValue', e.target.value)}
          placeholder="Search by name, description, or location"
        />
      </FilterField>
      <FilterField label="Status">
        <Select
          value={filters.status || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'status',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All statuses" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All statuses</Select.Item>
            <Select.Item value={ProviderStatus.PENDING}>Pending</Select.Item>
            <Select.Item value={ProviderStatus.APPROVED}>Approved</Select.Item>
            <Select.Item value={ProviderStatus.REJECTED}>Rejected</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Category">
        <NestedCategoryFilter
          variant="category"
          value={filters.categoryId}
          onChange={(value) => handleFilterChange('categoryId', value)}
          id="onefit-provider-filter-category"
        />
      </FilterField>
      <FilterField label="Active Status">
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
