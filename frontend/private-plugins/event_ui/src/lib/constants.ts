import { EventStatus, InvitationStatus } from '~/types/event';

export const EVENTS_PER_PAGE = 30;

export const EVENTS_CURSOR_SESSION_KEY = 'event-events-cursor';

export const EVENT_STATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
};

export const EVENT_TABS = ['upcoming', 'past', 'draft'] as const;

export type EventPageTab = (typeof EVENT_TABS)[number];

export const EVENT_TAB_LABELS: Record<EventPageTab, string> = {
  upcoming: 'Upcoming',
  past: 'Past',
  draft: 'Draft',
};

export const ATTENDANCE_LABELS: Record<InvitationStatus, string> = {
  going: 'Going',
  maybe: 'Maybe',
  declined: 'Declined',
  pending: 'Pending',
};

export const ATTENDANCE_COLORS: Record<InvitationStatus, string> = {
  going: 'var(--success)',
  maybe: 'var(--warning)',
  declined: 'var(--destructive)',
  pending: 'var(--muted-foreground)',
};

export const ATTENDANCE_ORDER: InvitationStatus[] = [
  'going',
  'maybe',
  'declined',
  'pending',
];
