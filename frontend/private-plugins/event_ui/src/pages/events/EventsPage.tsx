import { IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import {
  Breadcrumb,
  Button,
  PageContainer,
  PageSubHeader,
  Separator,
  useQueryState,
} from 'erxes-ui';
import { Link } from 'react-router-dom';
import { PageHeader } from 'ui-modules';
import { EventFormSheet } from '@/events/components/EventFormSheet';
import { EventsFilter } from '@/events/components/EventsFilter';
import { EventsRecordTable } from '@/events/components/EventsRecordTable';
import { SendInvitationDialog } from '@/events/components/SendInvitationDialog';

const FAVORITE_BREADCRUMB = ['Events'];

export const EventsPage = () => {
  const [, setEditEventId] = useQueryState<string>('editEventId');

  return (
    <PageContainer>
      <PageHeader>
        <PageHeader.Start>
          <Breadcrumb>
            <Breadcrumb.List className="gap-1">
              <Breadcrumb.Item>
                <Button variant="ghost" asChild>
                  <Link to="/event">
                    <IconCalendarEvent />
                    Events
                  </Link>
                </Button>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb>
          <Separator.Inline />
          <PageHeader.FavoriteToggleButton
            breadcrumb={FAVORITE_BREADCRUMB}
            icon="IconCalendarEvent"
          />
        </PageHeader.Start>
        <PageHeader.End>
          <Button onClick={() => setEditEventId('new')}>
            <IconPlus />
            Add event
          </Button>
        </PageHeader.End>
      </PageHeader>

      <PageSubHeader>
        <EventsFilter />
      </PageSubHeader>

      <EventsRecordTable />

      <EventFormSheet />

      <SendInvitationDialog />
    </PageContainer>
  );
};
