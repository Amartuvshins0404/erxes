import { Input, Select } from 'erxes-ui';
import {
  CreditTransactionFilters,
  OneFitCreditTransactionType,
  OneFitCreditSource,
} from '../types/credit';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';

interface CreditTransactionFiltersProps {
  filters: CreditTransactionFilters;
  onFiltersChange: (filters: CreditTransactionFilters) => void;
}

export const CreditTransactionFiltersComponent = ({
  filters,
  onFiltersChange,
}: CreditTransactionFiltersProps) => {
  const handleFilterChange = (
    key: keyof CreditTransactionFilters,
    value: any,
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <OneFitFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="User">
        <SelectOneFitCustomer
          value={filters.userId || ''}
          onValueChange={(value) =>
            handleFilterChange('userId', value as string)
          }
        />
      </FilterField>
      <FilterField label="Transaction Type">
        <Select
          value={filters.transactionType || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'transactionType',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All</Select.Item>
            <Select.Item value={OneFitCreditTransactionType.PURCHASE}>
              Purchase
            </Select.Item>
            <Select.Item value={OneFitCreditTransactionType.USAGE}>
              Usage
            </Select.Item>
            <Select.Item value={OneFitCreditTransactionType.REFUND}>
              Refund
            </Select.Item>
            <Select.Item value={OneFitCreditTransactionType.EXPIRATION}>
              Expiration
            </Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Source">
        <Select
          value={filters.source || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'source',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All</Select.Item>
            <Select.Item value={OneFitCreditSource.INDIVIDUAL}>
              Individual
            </Select.Item>
            <Select.Item value={OneFitCreditSource.CORPORATE}>
              Corporate
            </Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Booking ID">
        <Input
          value={filters.bookingId || ''}
          onChange={(e) => handleFilterChange('bookingId', e.target.value)}
          placeholder="Filter by booking ID"
        />
      </FilterField>
    </OneFitFilterBase>
  );
};
