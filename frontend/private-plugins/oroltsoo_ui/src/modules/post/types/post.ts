import { IRecordTableCursorPageInfo } from 'erxes-ui';

export type PostStatus = 'draft' | 'published' | 'archived';

export interface IPost {
  _id: string;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  status: PostStatus;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPostListResponse {
  list: IPost[];
  totalCount: number;
  pageInfo: IRecordTableCursorPageInfo;
}
