import { mongooseStringRandomId } from 'erxes-api-shared/utils';
import { Schema } from 'mongoose';

import { IPostDocument } from '@/post/@types/post';
import { POST_STATUSES } from '~/constants';

export const postSchema = new Schema<IPostDocument>(
  {
    _id: mongooseStringRandomId,

    subdomain: { type: String, required: true, index: true, label: 'Subdomain' },
    entityId: { type: String, required: true, index: true, label: 'Entity id' },

    title: { type: String, label: 'Title' },
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
    syncedAt: { type: Date, label: 'Last synced at' },
  },
  { timestamps: true },
);

postSchema.index({ subdomain: 1, entityId: 1 }, { unique: true });
postSchema.index({ status: 1, publishedAt: -1 });
