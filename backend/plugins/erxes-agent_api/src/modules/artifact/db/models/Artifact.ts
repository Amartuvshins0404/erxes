import { Model } from 'mongoose';
import { IModels } from '~/connectionResolvers';
import { artifactSchema } from '@/artifact/db/definitions/artifact';
import {
  IMastraArtifact,
  IMastraArtifactDocument,
} from '@/artifact/@types/artifact';

export interface IMastraArtifactModel extends Model<IMastraArtifactDocument> {
  recordArtifact(doc: IMastraArtifact): Promise<IMastraArtifactDocument>;
  listByThread(threadId: string): Promise<IMastraArtifactDocument[]>;
  getByArtifactId(
    artifactId: string,
  ): Promise<IMastraArtifactDocument | null>;
  linkTurnToMessage(turnId: string, messageId: string): Promise<void>;
}

export const loadArtifactClass = (_models: IModels) => {
  class MastraArtifact {
    // Upsert by artifactId so a re-run / retry never duplicates a row.
    public static async recordArtifact(doc: IMastraArtifact) {
      const { artifactId, ...rest } = doc;
      return _models.MastraArtifact.findOneAndUpdate(
        { artifactId },
        { $set: { artifactId, ...rest } },
        { new: true, upsert: true },
      );
    }

    // A thread's artifacts, oldest → newest (creation order).
    public static async listByThread(threadId: string) {
      return _models.MastraArtifact.find({ threadId }).sort({ createdAt: 1 });
    }

    // One artifact by its public id — lets file_reader read back a chart/
    // document the agent generated earlier in the run.
    public static async getByArtifactId(artifactId: string) {
      if (!artifactId) return null;
      return _models.MastraArtifact.findOne({ artifactId });
    }

    // After a turn settles, stamp this turn's artifacts with the assistant
    // message id so the chat can re-render the inline cards on reload.
    public static async linkTurnToMessage(turnId: string, messageId: string) {
      if (!turnId || !messageId) return;
      await _models.MastraArtifact.updateMany(
        { turnId },
        { $set: { messageId } },
      );
    }
  }

  artifactSchema.loadClass(MastraArtifact);
  return artifactSchema;
};
