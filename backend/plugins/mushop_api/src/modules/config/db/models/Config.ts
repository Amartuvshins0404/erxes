import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { mushopConfigSchema } from '@/config/db/definitions/config';
import {
  IMushopConfig,
  IMushopConfigDocument,
} from '@/config/@types/config';

export interface IMushopConfigModel extends Model<IMushopConfigDocument> {
  getByCode(code: string): Promise<IMushopConfigDocument | null>;
  getByCodes(codes: string[]): Promise<IMushopConfigDocument[]>;
  save(
    code: string,
    value: IMushopConfig['value'],
  ): Promise<IMushopConfigDocument>;
}

export const loadMushopConfigClass = (models: IModels) => {
  class MushopConfig {
    public static async getByCode(code: string) {
      return models.Config.findOne({ code }).lean();
    }

    public static async getByCodes(codes: string[]) {
      return models.Config.find({ code: { $in: codes } }).lean();
    }

    public static async save(code: string, value: IMushopConfig['value']) {
      return models.Config.findOneAndUpdate(
        { code },
        { $set: { value }, $setOnInsert: { code } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
  }

  mushopConfigSchema.loadClass(MushopConfig);

  return mushopConfigSchema;
};
