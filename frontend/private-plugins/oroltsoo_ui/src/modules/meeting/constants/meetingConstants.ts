import { MeetingStatus } from '../types/meeting';

export const MEETINGS_CURSOR_SESSION_KEY = 'oroltsoo-meetings-cursor';

export const MEETINGS_PER_PAGE = 30;

export const MEETING_STATUS_OPTIONS: {
  value: MeetingStatus;
  label: string;
  badge: 'info' | 'success' | 'destructive';
}[] = [
  { value: 'planned', label: 'Товлосон', badge: 'info' },
  { value: 'done', label: 'Болсон', badge: 'success' },
  { value: 'cancelled', label: 'Цуцалсан', badge: 'destructive' },
];
