import { Input, Select } from 'erxes-ui';
import { BannerFilters as BannerFiltersType } from '../types/banner';
import { BannerType, BannerStatus } from '../types/banner';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { SelectProvider } from './SelectProvider';

interface BannerFiltersProps {
  filters: BannerFiltersType;
  onFiltersChange: (filters: BannerFiltersType) => void;
}

export const BannerFilters = ({
  filters,
  onFiltersChange,
}: BannerFiltersProps) => {
  const handleFilterChange = (key: keyof BannerFiltersType, value: any) => {
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
      <FilterField label="Provider">
        <SelectProvider
          selected={filters.providerId}
          onSelect={(value) => handleFilterChange('providerId', value)}
        />
      </FilterField>
      <FilterField label="Type">
        <Select
          value={filters.type || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'type',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All types" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All types</Select.Item>
            <Select.Item value={BannerType.ADULT}>Adult</Select.Item>
            <Select.Item value={BannerType.CHILD}>Child</Select.Item>
          </Select.Content>
        </Select>
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
            <Select.Item value={BannerStatus.ACTIVE}>Active</Select.Item>
            <Select.Item value={BannerStatus.INACTIVE}>Inactive</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
    </OneFitFilterBase>
  );
};
