import { ExpectedError } from 'erxes-api-shared/utils';
import { Model } from 'mongoose';

import {
  IProfileDocument,
  IProfileSyncInput,
} from '@/profile/@types/profile';
import { profileSchema } from '@/profile/db/definitions/profile';
import { IModels } from '~/connectionResolvers';
import { REVIEW_STATUSES } from '~/constants';

export interface IProfileModel extends Model<IProfileDocument> {
  getProfile(_id: string): Promise<IProfileDocument>;
  syncProfile(
    subdomain: string,
    entityId: string,
    input: IProfileSyncInput,
  ): Promise<IProfileDocument | null>;
  setReviewStatus(
    _id: string,
    reviewStatus: string,
    reviewNote?: string,
  ): Promise<IProfileDocument | null>;
}

export const loadProfileClass = (models: IModels) => {
  class Profile {
    public static async getProfile(_id: string) {
      const profile = await models.Profile.findOne({ _id }).lean();

      if (!profile) {
        throw new ExpectedError('Профайл олдсонгүй', 'NOT_FOUND');
      }

      return profile;
    }

    public static async syncProfile(
      subdomain: string,
      entityId: string,
      input: IProfileSyncInput,
    ) {
      if (!input?.firstName) {
        throw new ExpectedError(
          'firstName is required in the sync payload',
          'BAD_USER_INPUT',
        );
      }

      return models.Profile.findOneAndUpdate(
        { subdomain, entityId },
        {
          $set: { ...input, syncedAt: new Date() },
          $setOnInsert: {
            subdomain,
            entityId,
            reviewStatus: REVIEW_STATUSES.PENDING,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    public static async setReviewStatus(
      _id: string,
      reviewStatus: string,
      reviewNote?: string,
    ) {
      if (!REVIEW_STATUSES.ALL.includes(reviewStatus)) {
        throw new ExpectedError('Хяналтын төлөв буруу байна', 'BAD_USER_INPUT');
      }

      await models.Profile.getProfile(_id);

      return models.Profile.findOneAndUpdate(
        { _id },
        { $set: { reviewStatus, reviewNote: reviewNote?.trim() ?? '' } },
        { new: true },
      );
    }
  }

  profileSchema.loadClass(Profile);

  return profileSchema;
};
