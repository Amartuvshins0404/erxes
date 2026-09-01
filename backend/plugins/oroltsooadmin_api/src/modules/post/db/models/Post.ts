import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import { IPostDocument, IPostSyncInput } from '@/post/@types/post';
import { postSchema } from '@/post/db/definitions/post';
import { IModels } from '~/connectionResolvers';

export interface IPostModel extends Model<IPostDocument> {
  getPost(_id: string): Promise<IPostDocument>;
  syncPost(
    subdomain: string,
    entityId: string,
    input: IPostSyncInput,
  ): Promise<IPostDocument | null>;
  removeSyncedPost(
    subdomain: string,
    entityId: string,
  ): Promise<{ deletedCount?: number }>;
}

export const loadPostClass = (models: IModels) => {
  class Post {
    public static async getPost(_id: string) {
      const post = await models.Post.findOne({ _id }).lean();

      if (!post) {
        throw new ExpectedError('Пост олдсонгүй', 'NOT_FOUND');
      }

      return post;
    }

    public static async syncPost(
      subdomain: string,
      entityId: string,
      input: IPostSyncInput,
    ) {
      if (!input?.title) {
        throw new ExpectedError(
          'title is required in the sync payload',
          'BAD_USER_INPUT',
        );
      }

      return models.Post.findOneAndUpdate(
        { subdomain, entityId },
        {
          $set: { ...input, syncedAt: new Date() },
          $setOnInsert: { subdomain, entityId },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async removeSyncedPost(subdomain: string, entityId: string) {
      return models.Post.deleteOne({ subdomain, entityId });
    }
  }

  postSchema.loadClass(Post);

  return postSchema;
};
