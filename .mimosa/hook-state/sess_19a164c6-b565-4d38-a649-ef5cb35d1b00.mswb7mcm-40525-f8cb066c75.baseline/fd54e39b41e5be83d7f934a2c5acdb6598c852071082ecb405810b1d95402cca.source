import { Input, Select } from 'erxes-ui';
import { MtoFilterBase } from '~/components/MtoFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { EventFilters as EventFiltersType } from '@/event/types/eventFilters';
import { EventCategoryFilters } from '@/event/components/EventCategoryFilters';

const ACTIVE_OPTIONS = [
  { value: '__all__', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const STATUS_OPTIONS = [
  { value: '__all__', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
];

interface EventFiltersProps {
  filters: EventFiltersType;
  onFiltersChange: (filters: EventFiltersType) => void;
}

export function EventFilters({
  filters,
  onFiltersChange,
}: EventFiltersProps) {
  return (
    <MtoFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Search">
        <Input
          value={filters.searchValue ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              searchValue: e.target.value || undefined,
            })
          }
          placeholder="Title or location"
        />
      </FilterField>
      <EventCategoryFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
      />
      <FilterField label="Publish status">
        <Select
          value={filters.status ?? '__all__'}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              status:
                v === '__all__' ? undefined : (v as EventFiltersType['status']),
            })
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            {STATUS_OPTIONS.map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Active">
        <Select
          value={
            filters.isActive === undefined ? '__all__' : String(filters.isActive)
          }
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              isActive: v === '__all__' ? undefined : v === 'true',
            })
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            {ACTIVE_OPTIONS.map((o) => (
              <Select.Item key={o.value} value={o.value}>
                {o.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Start date from">
        <Input
          type="date"
          value={filters.startDateFrom ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              startDateFrom: e.target.value || undefined,
            })
          }
        />
      </FilterField>
      <FilterField label="Start date to">
        <Input
          type="date"
          value={filters.startDateTo ?? ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              startDateTo: e.target.value || undefined,
            })
          }
        />
      </FilterField>
    </MtoFilterBase>
  );
}
