import { useQuery } from '@apollo/client';
import { Select } from 'erxes-ui';
import { OneFitFilterBase } from '~/components/OneFitFilterBase';
import { FilterField } from '~/components/shared/FilterField';
import { SelectCompany } from '~/modules/credit/components/SelectCompany';
import { ONE_FIT_ACTIVE_MEMBERSHIP_PLANS } from '~/modules/membership/graphql/membershipPlanQueries';
import { OneFitMembershipPlan } from '~/modules/membership/types/membership';
import { SelectOneFitCustomer } from '~/modules/onefitCustomer/components/SelectOneFitCustomer';
import { MembershipPurchaseFilters } from '../types/membershipPurchase';

interface MembershipPurchaseFiltersProps {
  filters: MembershipPurchaseFilters;
  onFiltersChange: (filters: MembershipPurchaseFilters) => void;
}

export function MembershipPurchaseFiltersComponent({
  filters,
  onFiltersChange,
}: MembershipPurchaseFiltersProps) {
  const { data } = useQuery(ONE_FIT_ACTIVE_MEMBERSHIP_PLANS);
  const plans: OneFitMembershipPlan[] = data?.oneFitActiveMembershipPlans || [];

  function handleFilterChange(
    key: keyof MembershipPurchaseFilters,
    value: any,
  ) {
    onFiltersChange({
      ...filters,
      [key]: value === '' || value === null ? undefined : value,
    });
  }

  return (
    <OneFitFilterBase filters={filters} onFiltersChange={onFiltersChange}>
      <FilterField label="Customer">
        <SelectOneFitCustomer.InlineCell
          value={filters.userId || ''}
          onValueChange={(value) =>
            handleFilterChange('userId', value as string)
          }
          mode="single"
          type="erxes"
        />
      </FilterField>

      <FilterField label="Company">
        <SelectCompany
          value={filters.companyId || ''}
          onValueChange={(value) => handleFilterChange('companyId', value)}
          placeholder="All companies"
        />
      </FilterField>

      <FilterField label="Plan">
        <Select
          value={filters.planId || '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'planId',
              value === '__all__' ? undefined : value,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All plans" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All plans</Select.Item>
            {plans.map((plan) => (
              <Select.Item key={plan._id} value={plan._id}>
                {plan.name}
              </Select.Item>
            ))}
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
            <Select.Item value="pending">Pending</Select.Item>
            <Select.Item value="paid">Paid</Select.Item>
            <Select.Item value="cancelled">Cancelled</Select.Item>
            <Select.Item value="failed">Failed</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>

      <FilterField label="Activation / Check-in">
        <Select
          value={
            filters.isActivated === undefined
              ? '__all__'
              : filters.isActivated
                ? 'activated'
                : 'not_activated'
          }
          onValueChange={(value) =>
            handleFilterChange(
              'isActivated',
              value === '__all__'
                ? undefined
                : value === 'activated'
                  ? true
                  : false,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All</Select.Item>
            <Select.Item value="activated">Activated</Select.Item>
            <Select.Item value="not_activated">
              Not activated / Not checked in
            </Select.Item>
          </Select.Content>
        </Select>
      </FilterField>

      <FilterField label="Paid + Not activated">
        <Select
          value={filters.isPaidNotActivated ? 'yes' : '__all__'}
          onValueChange={(value) =>
            handleFilterChange(
              'isPaidNotActivated',
              value === '__all__' ? undefined : true,
            )
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="All" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all__">All</Select.Item>
            <Select.Item value="yes">Paid and not activated</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>

      <FilterField label="Sort by">
        <Select
          value={filters.sortField || 'createdAt'}
          onValueChange={(value) =>
            handleFilterChange('sortField', value || 'createdAt')
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="Created date" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="createdAt">Created date</Select.Item>
            <Select.Item value="purchasedAt">Purchased date</Select.Item>
            <Select.Item value="paidAt">Paid date</Select.Item>
            <Select.Item value="activatedAt">Activated date</Select.Item>
            <Select.Item value="expiresAt">Expires date</Select.Item>
            <Select.Item value="amount">Amount</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>

      <FilterField label="Sort direction">
        <Select
          value={filters.sortDirection || 'desc'}
          onValueChange={(value) =>
            handleFilterChange('sortDirection', value || 'desc')
          }
        >
          <Select.Trigger>
            <Select.Value placeholder="Descending" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="desc">Descending</Select.Item>
            <Select.Item value="asc">Ascending</Select.Item>
          </Select.Content>
        </Select>
      </FilterField>
    </OneFitFilterBase>
  );
}
