import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import { IPost, IPostDocument } from '@/post/@types/post';
import { postSchema } from '@/post/db/definitions/post';
import { IModels } from '~/connectionResolvers';
import { trim } from '~/utils/normalize';
import { POST_STATUSES } from '~/constants';

export interface IPostModel extends Model<IPostDocument> {
  getPost(_id: string): Promise<IPostDocument>;
  createPost(doc: IPost): Promise<IPostDocument>;
  updatePost(_id: string, doc: IPost): Promise<IPostDocument | null>;
  removePosts(_ids: string[]): Promise<{ deletedCount?: number }>;
}

const normalize = (doc: IPost, previous?: IPostDocument | null) => {
  const title = trim(doc.title);

  if (!title) {
    throw new ExpectedError('Постын гарчгийг оруулна уу', 'BAD_USER_INPUT');
  }

  const status = POST_STATUSES.ALL.includes(doc.status)
    ? doc.status
    : POST_STATUSES.DRAFT;

  let publishedAt = doc.publishedAt ? new Date(doc.publishedAt) : null;

  if (!publishedAt && status === POST_STATUSES.PUBLISHED) {
    publishedAt = previous?.publishedAt
      ? new Date(previous.publishedAt)
      : new Date();
  }

  return {
    title,
    excerpt: trim(doc.excerpt),
    content: doc.content ?? '',
    coverImage: trim(doc.coverImage),
    tags: (doc.tags || []).map(trim).filter(Boolean),
    status,
    publishedAt,
  };
};

export const loadPostClass = (models: IModels) => {
  class Post {
    public static async getPost(_id: string) {
      const post = await models.Post.findOne({ _id }).lean();

      if (!post) {
        throw new ExpectedError('Пост олдсонгүй', 'NOT_FOUND');
      }

      return post;
    }

    public static async createPost(doc: IPost) {
      return models.Post.create(normalize(doc));
    }

    public static async updatePost(_id: string, doc: IPost) {
      const previous = await models.Post.getPost(_id);

      return models.Post.findOneAndUpdate(
        { _id },
        { $set: normalize(doc, previous) },
        { new: true },
      );
    }

    public static async removePosts(_ids: string[]) {
      if (!_ids?.length) {
        throw new ExpectedError('Устгах постоо сонгоно уу', 'BAD_USER_INPUT');
      }

      return models.Post.deleteMany({ _id: { $in: _ids } });
    }
  }

  postSchema.loadClass(Post);

  return postSchema;
};
