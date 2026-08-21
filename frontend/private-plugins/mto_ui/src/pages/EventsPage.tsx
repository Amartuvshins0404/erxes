import { IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  PageSubHeader,
  Separator,
} from 'erxes-ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { EventFilters } from '@/event/components/EventFilters';
import { EventFormSheet } from '@/event/components/EventFormSheet';
import { EventsRecordTable } from '@/event/components/EventsRecordTable';
import { useEvents } from '@/event/hooks/useEvents';

export function EventsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { refetch } = useEvents();

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/mto/events">
                    <IconCalendarEvent />
                    Events
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton />
        </PageHeader.Start>
        <PageHeader.End>
          <Button onClick={() => setCreateOpen(true)}>
            <IconPlus />
            Add Event
          </Button>
        </PageHeader.End>
      </PageHeader>
      <PageSubHeader>
        <EventFilters />
      </PageSubHeader>
      <EventsRecordTable />
      <EventFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => void refetch()}
      />
    </PageContainer>
  );
}
