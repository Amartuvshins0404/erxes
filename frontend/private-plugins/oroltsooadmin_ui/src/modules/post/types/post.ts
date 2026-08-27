import { IRecordTableCursorPageInfo } from 'erxes-ui';

export type PostStatus = 'draft' | 'published' | 'archived';

export interface IAdminPost {
  _id: string;
  subdomain?: string;
  entityId?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  status?: PostStatus;
  publishedAt?: string | null;
  syncedAt?: string | null;
}

export interface IAdminPostListResponse {
  list: IAdminPost[];
  totalCount: number;
  pageInfo: IRecordTableCursorPageInfo;
}
