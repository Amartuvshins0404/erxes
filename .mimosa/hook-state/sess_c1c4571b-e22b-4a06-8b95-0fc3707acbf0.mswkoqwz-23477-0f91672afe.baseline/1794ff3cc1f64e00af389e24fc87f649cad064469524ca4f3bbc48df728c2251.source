import { IconCalendar } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useState } from 'react';
import { ScheduleTemplatesList } from '~/modules/schedule/components/ScheduleTemplatesList';
import { ScheduleTemplateFiltersComponent } from '~/modules/schedule/components/ScheduleTemplateFilters';
import { CreateScheduleTemplateDialog } from '~/modules/schedule/components/ScheduleTemplateDialog';
import { CopyPreviousMonthDialog } from '~/modules/schedule/components/CopyPreviousMonthDialog';
import { ScheduleTemplateFilters } from '~/modules/schedule/types/schedule';
import { ScheduleExceptionsList } from '~/modules/schedule/components/ScheduleExceptionsList';
import { ScheduleExceptionFiltersComponent } from '~/modules/schedule/components/ScheduleExceptionFilters';
import { CreateScheduleExceptionDialog } from '~/modules/schedule/components/CreateScheduleExceptionDialog';
import { ScheduleExceptionFilters } from '~/modules/schedule/types/schedule';
import { ScheduleCoverageTab } from '~/modules/schedule/components/ScheduleCoverageTab';
import { OneFitTabbedListPageLayout } from '~/components/OneFitTabbedListPageLayout';

export function SchedulesPage() {
  const [templateFilters, setTemplateFilters] =
    useState<ScheduleTemplateFilters>({});
  const [exceptionFilters, setExceptionFilters] =
    useState<ScheduleExceptionFilters>({
      providerId: '',
    });
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  const tabs = [
    {
      value: 'templates',
      label: 'Schedule Templates',
      filters: templateFilters,
      onFiltersChange: setTemplateFilters,
      filtersComponent: ScheduleTemplateFiltersComponent,
      listComponent: ScheduleTemplatesList,
      createDialog: <CreateScheduleTemplateDialog />,
      headerActions: (
        <Button variant="outline" onClick={() => setCopyDialogOpen(true)}>
          Copy Previous Month
        </Button>
      ),
    },
    {
      value: 'coverage',
      label: 'Coverage',
      filters: {},
      onFiltersChange: () => undefined,
      filtersComponent: () => null,
      listComponent: () => <ScheduleCoverageTab />,
    },
    {
      value: 'exceptions',
      label: 'Schedule Exceptions',
      filters: exceptionFilters,
      onFiltersChange: setExceptionFilters,
      filtersComponent: ScheduleExceptionFiltersComponent,
      listComponent: ScheduleExceptionsList,
      createDialog: <CreateScheduleExceptionDialog />,
      // emptyState: !exceptionFilters.providerId ? (
      //   <div className="m-4 p-4 text-center text-muted-foreground">
      //     Please enter a Provider ID in the filters to view schedule exceptions.
      //   </div>
      // ) : undefined,
    },
  ] as const;

  return (
    <>
      <OneFitTabbedListPageLayout
        pageName="Schedules"
        pageIcon={<IconCalendar />}
        defaultTab="templates"
        tabs={tabs as any}
      />
      <CopyPreviousMonthDialog
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        onClose={() => setCopyDialogOpen(false)}
      />
    </>
  );
}
