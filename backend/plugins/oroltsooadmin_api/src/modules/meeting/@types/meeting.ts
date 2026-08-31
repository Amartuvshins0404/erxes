import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';

export interface IMeetingInput {
  title: string;
  location?: string;
  scheduledAt?: Date | null;
  note?: string;
  status?: string;
}

export interface IMeetingRequester {
  cpUserId: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface ICpMeetingUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface IMeetingRequestInput {
  subdomain: string;
  title: string;
  location?: string;
  scheduledAt: Date;
  note?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface IMeeting extends IMeetingInput {
  subdomain: string;
  status: string;
  source: string;
  requestedBy?: IMeetingRequester;
}

export interface IMeetingDocument extends IMeeting, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMeetingListParams extends ICursorPaginateParams {
  searchValue?: string;
  subdomain?: string;
  status?: string;
  source?: string;
  scheduledFrom?: Date;
  scheduledTo?: Date;
}
