import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { userSettingsSchema } from '@/settings/db/definitions/userSettings';
import {
  IMastraUserSettings,
  IMastraUserSettingsDocument,
} from '@/settings/@types/userSettings';

export interface IMastraUserSettingsModel
  extends Model<IMastraUserSettingsDocument> {
  getUserSettings(
    userId: string,
  ): Promise<IMastraUserSettingsDocument | null>;
  setUserQuota(
    userId: string,
    quota: number | null,
  ): Promise<IMastraUserSettingsDocument>;
}

export const loadUserSettingsClass = (_models: IModels) => {
  class MastraUserSettings {
    public static getUserSettings(userId: string) {
      return _models.MastraUserSettings.findOne({ userId });
    }

    public static setUserQuota(userId: string, quota: number | null) {
      const options = quota === null
        ? { $unset: { agentQuota: 1 } }
        : { $set: { agentQuota: quota } };

      return _models.MastraUserSettings.findOneAndUpdate(
        { userId },
        options,
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }

  userSettingsSchema.loadClass(MastraUserSettings);
  return userSettingsSchema;
};
