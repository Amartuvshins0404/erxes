import { useApolloClient } from '@apollo/client';
import { useState } from 'react';
import { Button } from 'erxes-ui';
import { IconCalendarEvent } from '@tabler/icons-react';
import { MtoListPageLayout } from '~/components/MtoListPageLayout';
import { EventFilters } from '@/event/components/EventFilters';
import { EventsList } from '@/event/components/EventsList';
import { EventFilters as EventFiltersType } from '@/event/types/eventFilters';
import { EventFormSheet } from '@/event/components/EventFormSheet';
import { MTO_EVENTS } from '@/event/graphql/eventQueries';

export function EventsPage() {
  const client = useApolloClient();
  const [filters, setFilters] = useState<EventFiltersType>({});
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <MtoListPageLayout
        pageName="Events"
        pageIcon={<IconCalendarEvent />}
        filters={filters}
        onFiltersChange={setFilters}
        filtersComponent={EventFilters}
        listComponent={EventsList}
        createDialog={
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            Add Event
          </Button>
        }
        createDialogInHeader
      />

      <EventFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          void client.refetchQueries({ include: [MTO_EVENTS] });
        }}
      />
    </>
  );
}
