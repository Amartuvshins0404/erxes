import { useQuery } from '@apollo/client';
import { Input, Select } from 'erxes-ui';
import { ONE_FIT_ACTIVE_MEMBERSHIP_PLANS } from '~/modules/membership/graphql/membershipPlanQueries';
import { OneFitMembershipPlan } from '~/modules/membership/types/membership';
import {
  OneFitCustomerFilters,
  OneFitMembershipStatus,
} from '../types/onefitCustomer';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';

interface OneFitCustomerFiltersProps {
  filters: OneFitCustomerFilters;
  onFiltersChange: (filters: OneFitCustomerFilters) => void;
}

export const OneFitCustomerFiltersComponent = ({
  filters,
  onFiltersChange,
}: OneFitCustomerFiltersProps) => {
  const { data } = useQuery(ONE_FIT_ACTIVE_MEMBERSHIP_PLANS);
  const membershipPlans: OneFitMembershipPlan[] =
    data?.oneFitActiveMembershipPlans || [];

  const handleFilterChange = (key: keyof OneFitCustomerFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  return (
    <OneFitFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Phone">
        <Input
          value={filters.phone || ''}
          onChange={(e) =>
            handleFilterChange('phone', e.target.value || undefined)
          }
          placeholder="Filter by phone"
        />
      </FilterField>
      <FilterField label="Email">
        <Input
          value={filters.email || ''}
          onChange={(e) =>
            handleFilterChange('email', e.target.value || undefined)
          }
          placeholder="Filter by email"
        />
      </FilterField>
      <FilterField label="Membership Plan ID">
        <Select
          value={filters.membershipPlanId || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'membershipPlanId',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All membership plans" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All membership plans</Select.Item>
            {membershipPlans.map((plan) => (
              <Select.Item key={plan._id} value={plan._id}>
                {plan.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Membership Status">
        <Select
          value={filters.membershipStatus || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'membershipStatus',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All statuses" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All statuses</Select.Item>
            <Select.Item value={OneFitMembershipStatus.ACTIVE}>
              Active
            </Select.Item>
            <Select.Item value={OneFitMembershipStatus.EXPIRED}>
              Expired
            </Select.Item>
            <Select.Item value={OneFitMembershipStatus.NONE}>None</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Grace mode">
        <Select
          value={
            filters.graceMode === true
              ? 'true'
              : filters.graceMode === false
                ? 'false'
                : '__all__'
          }
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              graceMode: value === '__all__' ? undefined : value === 'true',
            })
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All</Select.Item>
            <Select.Item value="true">On</Select.Item>
            <Select.Item value="false">Off</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
      <FilterField label="Min Credit Balance">
        <Input
          type="number"
          value={filters.minCreditBalance || ''}
          onChange={(e) =>
            handleFilterChange(
              'minCreditBalance',
              e.target.value ? Number(e.target.value) : undefined,
            )
          }
          placeholder="Minimum credit balance"
        />
      </FilterField>
      <FilterField label="Max Credit Balance">
        <Input
          type="number"
          value={filters.maxCreditBalance || ''}
          onChange={(e) =>
            handleFilterChange(
              'maxCreditBalance',
              e.target.value ? Number(e.target.value) : undefined,
            )
          }
          placeholder="Maximum credit balance"
        />
      </FilterField>
      <FilterField label="Preferred Activity Type ID">
        <Input
          value={filters.preferredActivityTypeId || ''}
          onChange={(e) =>
            handleFilterChange(
              'preferredActivityTypeId',
              e.target.value || undefined,
            )
          }
          placeholder="Filter by preferred activity type"
        />
      </FilterField>
    </OneFitFilterBase>
  );
};
