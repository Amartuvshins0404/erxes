import { Input, Select } from 'erxes-ui';
import { PromoCodeFilters as PromoCodeFiltersType } from '../types/promoCode';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';

interface PromoCodeFiltersProps {
  filters: PromoCodeFiltersType;
  onFiltersChange: (filters: PromoCodeFiltersType) => void;
}

export const PromoCodeFilters = ({
  filters,
  onFiltersChange,
}: PromoCodeFiltersProps) => {
  const handleFilterChange = (
    key: keyof PromoCodeFiltersType,
    value: string | boolean | undefined,
  ) => {
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
      <FilterField label="Code">
        <Input
          value={filters.code || ''}
          onChange={(e) => handleFilterChange('code', e.target.value)}
          placeholder="Search by code"
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
      <FilterField label="Valid now">
        <Select
          value={
            filters.validNow === undefined
              ? '__all__'
              : filters.validNow
              ? 'true'
              : 'false'
          }
          onValueChange={(value) =>
            handleFilterChange(
              'validNow',
              value === '__all__' ? undefined : value === 'true',
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="Any" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">Any</Select.Item>
            <Select.Item value="true">Yes</Select.Item>
            <Select.Item value="false">No</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
    </OneFitFilterBase>
  );
};
