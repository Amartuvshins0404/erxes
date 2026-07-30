import { Select } from 'erxes-ui';
import { MtoFilterBase } from '~/components/MtoFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { AssociationFilters as AssociationFiltersType } from '@/association/types/associationFilters';

const ACTIVE_OPTIONS = [
  { value: '__all__', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

interface AssociationFiltersProps {
  filters: AssociationFiltersType;
  onFiltersChange: (filters: AssociationFiltersType) => void;
}

export function AssociationFilters({
  filters,
  onFiltersChange,
}: AssociationFiltersProps) {
  return (
    <MtoFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Status">
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
    </MtoFilterBase>
  );
}
