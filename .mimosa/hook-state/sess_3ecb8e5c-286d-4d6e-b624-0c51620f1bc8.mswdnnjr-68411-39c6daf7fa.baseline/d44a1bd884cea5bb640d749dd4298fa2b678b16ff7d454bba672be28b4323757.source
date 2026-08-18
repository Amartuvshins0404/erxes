import { IconUsers } from '@tabler/icons-react';
import { useState } from 'react';
import { OneFitCustomersList } from '~/modules/onefitCustomer/components/OneFitCustomersList';
import { OneFitCustomerFiltersComponent } from '~/modules/onefitCustomer/components/OneFitCustomerFilters';
import { OneFitCustomerFilters } from '~/modules/onefitCustomer/types/onefitCustomer';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';

export function OneFitCustomersPage() {
  const [filters, setFilters] = useState<OneFitCustomerFilters>({});

  return (
    <OneFitListPageLayout
      pageName="Customers"
      pageIcon={<IconUsers />}
      filters={filters}
      onFiltersChange={setFilters}
      filtersComponent={OneFitCustomerFiltersComponent}
      listComponent={OneFitCustomersList}
    />
  );
}
