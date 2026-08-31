import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';

export interface IMeetingInput {
  title: string;
  location?: string;
  scheduledAt?: Date | null;
  note?: string;
  status?: string;
}

export interface IMeeting extends IMeetingInput {
  subdomain: string;
  status: string;
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
  scheduledFrom?: Date;
  scheduledTo?: Date;
}
