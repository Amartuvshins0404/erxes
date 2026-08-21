export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
}

export enum EventTab {
  UPCOMING = 'upcoming',
  PAST = 'past',
  INVITED = 'invited',
  JOINED = 'joined',
}

export const AGENDA_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
