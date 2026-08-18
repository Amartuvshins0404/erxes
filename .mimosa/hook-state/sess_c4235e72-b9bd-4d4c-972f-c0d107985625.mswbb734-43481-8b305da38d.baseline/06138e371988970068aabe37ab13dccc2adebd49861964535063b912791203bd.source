import { Input } from 'erxes-ui';
import { ScheduleExceptionFilters } from '../types/schedule';
import { SelectProviderSearchable } from '~/modules/provider/components/SelectProviderSearchable';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';

interface ScheduleExceptionFiltersProps {
  filters: ScheduleExceptionFilters;
  onFiltersChange: (filters: ScheduleExceptionFilters) => void;
}

export const ScheduleExceptionFiltersComponent = ({
  filters,
  onFiltersChange,
}: ScheduleExceptionFiltersProps) => {
  const handleFilterChange = (
    key: keyof ScheduleExceptionFilters,
    value: any,
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      providerId: filters.providerId,
    });
  };

  return (
    <OneFitFilterBase
      filters={filters}
      onFiltersChange={onFiltersChange}
      excludeKeysFromCount={['providerId']}
      onClear={clearFilters}
    >
      <FilterField label="Provider *">
        <SelectProviderSearchable
          value={filters.providerId || ''}
          onValueChange={(value) =>
            handleFilterChange('providerId', value || undefined)
          }
        />
      </FilterField>
      <FilterField label="Start Date">
        <Input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) =>
            handleFilterChange('startDate', e.target.value || undefined)
          }
        />
      </FilterField>
      <FilterField label="End Date">
        <Input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) =>
            handleFilterChange('endDate', e.target.value || undefined)
          }
        />
      </FilterField>
    </OneFitFilterBase>
  );
};
