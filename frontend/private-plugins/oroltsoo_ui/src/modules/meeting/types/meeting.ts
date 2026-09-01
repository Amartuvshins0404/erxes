import { IRecordTableCursorPageInfo } from 'erxes-ui';

export type MeetingStatus = 'planned' | 'done' | 'cancelled';

export interface IMeeting {
  _id: string;
  title: string;
  location?: string;
  scheduledAt?: string | null;
  note?: string;
  status: MeetingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface IMeetingListResponse {
  list: IMeeting[];
  totalCount: number;
  pageInfo: IRecordTableCursorPageInfo;
}
