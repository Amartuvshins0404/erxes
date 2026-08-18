import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { pluginToolCurationSchema } from '@/plugintools/db/definitions/pluginTools';
import {
  IPluginToolCuration,
  IPluginToolCurationDocument,
} from '@/plugintools/@types/pluginTools';

export interface IPluginToolCurationModel
  extends Model<IPluginToolCurationDocument> {
  getCuration(plugin: string): Promise<IPluginToolCurationDocument | null>;
  saveCuration(
    doc: IPluginToolCuration,
  ): Promise<IPluginToolCurationDocument>;
}

export const loadPluginToolCurationClass = (_models: IModels) => {
  // Resolved lazily inside the static methods: the model isn't assigned onto
  // `_models` until after loadPluginToolCurationClass returns, but by request
  // time it is.
  class PluginToolCuration {
    public static async getCuration(plugin: string) {
      return _models.MastraPluginToolCuration.findOne({ plugin });
    }

    public static async saveCuration(doc: IPluginToolCuration) {
      const saved = await _models.MastraPluginToolCuration.findOneAndUpdate(
        { plugin: doc.plugin },
        {
          $set: {
            enabled: doc.enabled,
            disabledTools: doc.disabledTools,
          },
          $setOnInsert: { plugin: doc.plugin },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
      if (!saved) throw new Error('Plugin tool curation could not be saved');
      return saved;
    }
  }

  pluginToolCurationSchema.loadClass(PluginToolCuration);
  return pluginToolCurationSchema;
};
