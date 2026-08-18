import { Document } from 'mongoose';

export interface IPluginToolCuration {
  plugin: string;
  enabled: boolean;
  disabledTools: string[];
}

export interface IPluginToolCurationDocument
  extends IPluginToolCuration,
    Document {
  _id: string;
}
