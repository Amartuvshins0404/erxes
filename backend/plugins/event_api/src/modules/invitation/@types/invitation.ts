import { Document } from 'mongoose';
import { InvitationSource, InvitationStatus } from '@/invitation/constants';

export interface IEventInvitation {
  eventId: string;
  customerId: string;
  status: InvitationStatus;
  source: InvitationSource;
  respondedAt?: Date;
  message?: string;
  sentAt?: Date;
  sentBy?: string;
}

export interface IEventInvitationDocument extends IEventInvitation, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationQueryParams {
  eventId: string;
  status?: string;
  customerId?: string;
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
