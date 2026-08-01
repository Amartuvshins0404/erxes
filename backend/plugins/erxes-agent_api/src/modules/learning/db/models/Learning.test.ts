import { IModels } from '~/connectionResolvers';
import { loadLearningClass } from '@/learning/db/models/Learning';
import { IMastraLearningDocument } from '@/learning/@types/learning';

interface LearningStatics {
  mergeEvidence(
    _id: string,
    args: {
      agentId: string;
      confidence?: number;
      sourceHash?: string;
    },
  ): Promise<IMastraLearningDocument | null>;
}

describe('MastraLearning model', () => {
  it('merges evidence only into a lesson owned by the same agent', async () => {
    const findOneAndUpdate = jest.fn().mockResolvedValue(null);
    const models = {
      MastraLearning: { findOneAndUpdate },
    } as unknown as IModels;
    const statics = loadLearningClass(models)
      .statics as unknown as LearningStatics;

    await statics.mergeEvidence('learning-id', {
      agentId: 'agent-a',
      confidence: 0.8,
      sourceHash: 'source-hash',
    });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'learning-id', agentId: 'agent-a' },
      {
        $inc: { evidenceCount: 1 },
        $set: { lastReinforcedAt: expect.any(Date) },
        $addToSet: { sourceHashes: 'source-hash' },
        $max: { confidence: 0.8 },
      },
      { new: true },
    );
  });
});
