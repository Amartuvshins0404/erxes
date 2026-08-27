import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

import { IPostDocument } from '@/post/@types/post';
import { POST_STATUSES } from '~/constants';

export const postSchema = new Schema<IPostDocument>(
  {
    _id: mongooseStringRandomId,

    title: { type: String, required: true, label: 'Title' },
    excerpt: { type: String, label: 'Excerpt' },
    content: { type: String, label: 'Content' },
    coverImage: { type: String, label: 'Cover image' },
    tags: { type: [String], default: [], label: 'Tags' },
    status: {
      type: String,
      enum: POST_STATUSES.ALL,
      default: POST_STATUSES.DRAFT,
      label: 'Status',
    },
    publishedAt: { type: Date, label: 'Published at' },
  },
  { timestamps: true },
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ tags: 1 });
