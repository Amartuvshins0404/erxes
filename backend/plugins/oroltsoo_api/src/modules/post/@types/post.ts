import { ICursorPaginateParams } from 'erxes-api-shared/core-types';
import { Document } from 'mongoose';

export interface IPost {
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  status: string;
  publishedAt?: Date | null;
}

export interface IPostDocument extends IPost, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostListParams extends ICursorPaginateParams {
  searchValue?: string;
  status?: string;
  tag?: string;
  publishedFrom?: Date;
  publishedTo?: Date;
}
