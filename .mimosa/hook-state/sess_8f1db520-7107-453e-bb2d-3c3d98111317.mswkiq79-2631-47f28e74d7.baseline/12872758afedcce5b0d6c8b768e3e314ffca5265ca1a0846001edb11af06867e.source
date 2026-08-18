import { IRecordTableCursorPageInfo } from 'erxes-ui';

export type EventStatus = 'draft' | 'published' | 'cancelled';

export type EventTab = 'upcoming' | 'past' | 'invited' | 'joined';

export type InvitationStatus = 'pending' | 'going' | 'maybe' | 'declined';

export interface IEventAgendaItem {
  startTime: string;
  endTime: string;
  title: string;
  description?: string | null;
}

export interface IEventLocation {
  city?: string | null;
  district?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface IEvent {
  _id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  images?: string[] | null;
  videoUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: IEventLocation | null;
  isOnline?: boolean | null;
  onlineUrl?: string | null;
  capacity?: number | null;
  status?: EventStatus | null;
  agenda?: IEventAgendaItem[] | null;
  ownerId?: string | null;
  goingCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IEventList {
  list: IEvent[];
  pageInfo: IRecordTableCursorPageInfo;
  totalCount: number;
}

export interface IEventInvitationCustomer {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  primaryEmail?: string | null;
  avatar?: string | null;
}

export interface IEventInvitation {
  _id: string;
  eventId: string;
  customerId: string;
  status: InvitationStatus;
  source: 'invited' | 'self';
  respondedAt?: string | null;
  createdAt?: string | null;
  customer?: IEventInvitationCustomer | null;
}

export interface IEventInvitationList {
  list: IEventInvitation[];
  pageInfo: IRecordTableCursorPageInfo;
  totalCount: number;
}

export interface IAttendanceCount {
  status: InvitationStatus;
  count: number;
  percentage: number;
}

export interface IAttendanceSummary {
  eventId: string;
  total: number;
  counts: IAttendanceCount[];
}
