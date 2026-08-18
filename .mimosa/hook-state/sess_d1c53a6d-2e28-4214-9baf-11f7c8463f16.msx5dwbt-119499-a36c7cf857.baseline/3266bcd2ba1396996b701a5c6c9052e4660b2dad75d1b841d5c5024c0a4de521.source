import { useState } from 'react';
import { MembershipPlansList } from '~/modules/membership/components/MembershipPlansList';
import { MembershipPlanDialog } from '~/modules/membership/components/MembershipPlanDialog';
import { IconPlus } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { MembershipPlanFiltersComponent } from '~/modules/membership/components/MembershipPlanFilters';
import { MembershipPlanFilters } from '~/modules/membership/types/membership';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';

export function MembershipPlansPage() {
  const [filters, setFilters] = useState<MembershipPlanFilters>({});

  return (
    <OneFitListPageLayout
      pageName="Membership Plans"
      filters={filters}
      onFiltersChange={setFilters}
      filtersComponent={MembershipPlanFiltersComponent}
      createDialog={
        <MembershipPlanDialog
          trigger={
            <Button>
              <IconPlus />
              Create Membership Plan
            </Button>
          }
        />
      }
      listComponent={MembershipPlansList}
    />
  );
}
