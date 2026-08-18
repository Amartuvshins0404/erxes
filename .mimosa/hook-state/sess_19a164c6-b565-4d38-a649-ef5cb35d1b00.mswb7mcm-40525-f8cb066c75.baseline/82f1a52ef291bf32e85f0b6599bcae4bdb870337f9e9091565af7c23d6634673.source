import { Input, Select } from 'erxes-ui';
import { useQuery } from '@apollo/client';
import { EnumCursorDirection, EnumCursorMode } from 'erxes-ui';
import { ActivityTypeFilters, GenderRestriction } from '../types/activityType';
import { ONE_FIT_PROVIDERS } from '~/modules/provider/graphql/providerQueries';
import { NestedCategoryFilter } from '~/modules/category/components/NestedCategoryFilter';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';

interface ActivityTypeFiltersProps {
  filters: ActivityTypeFilters;
  onFiltersChange: (filters: ActivityTypeFilters) => void;
}

export const ActivityTypeFiltersComponent = ({
  filters,
  onFiltersChange,
}: ActivityTypeFiltersProps) => {
  useQuery(ONE_FIT_PROVIDERS, {
    variables: {
      limit: 100,
      cursor: undefined,
      cursorMode: EnumCursorMode.INCLUSIVE,
      direction: EnumCursorDirection.FORWARD,
    },
  });

  const handleFilterChange = (key: keyof ActivityTypeFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <OneFitFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Search">
        <Input
          value={filters.searchValue || ''}
          onChange={(e) => handleFilterChange('searchValue', e.target.value)}
          placeholder="Search by name or description"
        />
      </FilterField>
      <FilterField label="Provider">
        <FilterField label="Provider">
          <SelectProviderSearchable
            value={filters.providerId || ''}
            onValueChange={(value) =>
              handleFilterChange('providerId', value || undefined)
            }
          />
        </FilterField>
      </FilterField>
      <FilterField label="Category">
        <NestedCategoryFilter
          variant="category"
          value={filters.categoryId}
          onChange={(value) => handleFilterChange('categoryId', value)}
          id="onefit-activity-type-filter-category"
        />
      </FilterField>
      <FilterField label="Gender Restriction">
        <Select
          value={filters.genderRestriction || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'genderRestriction',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All restrictions" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All restrictions</Select.Item>
            <Select.Item value={GenderRestriction.MIXED}>Mixed</Select.Item>
            <Select.Item value={GenderRestriction.MALE}>Male</Select.Item>
            <Select.Item value={GenderRestriction.FEMALE}>Female</Select.Item>
          </Select.Content>
        </Select>
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
