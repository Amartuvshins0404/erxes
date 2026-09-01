import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';

export interface IPostSyncInput {
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  status?: string;
  publishedAt?: Date | null;
}

export interface IPost extends IPostSyncInput {
  subdomain: string;
  entityId: string;
  syncedAt: Date;
}

export interface IPostDocument extends IPost, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostListParams extends ICursorPaginateParams {
  searchValue?: string;
  subdomain?: string;
  status?: string;
  tag?: string;
}
