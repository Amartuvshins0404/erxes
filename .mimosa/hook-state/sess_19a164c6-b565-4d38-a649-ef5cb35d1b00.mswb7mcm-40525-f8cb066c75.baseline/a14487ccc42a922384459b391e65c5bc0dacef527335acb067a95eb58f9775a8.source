import { useState } from 'react';
import { ActivityTypesList } from '~/modules/activity-type/components/ActivityTypesList';
import { CreateActivityTypeDialog } from '~/modules/activity-type/components/ActivityTypeDialog';
import { ActivityTypeFiltersComponent } from '~/modules/activity-type/components/ActivityTypeFilters';
import { ActivityTypeFilters } from '~/modules/activity-type/types/activityType';
import { OneFitListPageLayout } from '~/components/OneFitListPageLayout';

export function ActivityTypesPage() {
  const [filters, setFilters] = useState<ActivityTypeFilters>({});

  return (
    <OneFitListPageLayout
      pageName="Activity Types"
      filters={filters}
      onFiltersChange={setFilters}
      filtersComponent={ActivityTypeFiltersComponent}
      createDialog={<CreateActivityTypeDialog />}
      listComponent={ActivityTypesList}
    />
  );
}
