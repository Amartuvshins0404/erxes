import type { IModels } from '~/connectionResolvers';
import type { IMastraArtifact } from '@/artifact/@types/artifact';
import { loadArtifactClass } from '@/artifact/db/models/Artifact';

interface ArtifactStatics {
  recordArtifacts(docs: IMastraArtifact[]): Promise<void>;
}

const artifact = (artifactId: string): IMastraArtifact => ({
  artifactId,
  threadId: 'thread-1',
  turnId: 'turn-1',
  kind: 'document',
  title: artifactId,
  fileKey: `private/${artifactId}.pdf`,
});

describe('MastraArtifact model', () => {
  it('upserts a preview batch in one MongoDB operation', async () => {
    const bulkWrite = jest.fn().mockResolvedValue({ modifiedCount: 2 });
    const models = {
      MastraArtifact: { bulkWrite },
    } as unknown as IModels;
    const statics = loadArtifactClass(models)
      .statics as unknown as ArtifactStatics;

    await statics.recordArtifacts([artifact('doc-1'), artifact('doc-2')]);

    expect(bulkWrite).toHaveBeenCalledTimes(1);
    expect(bulkWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: { artifactId: 'doc-1' },
          upsert: true,
        }),
      }),
      expect.objectContaining({
        updateOne: expect.objectContaining({
          filter: { artifactId: 'doc-2' },
          upsert: true,
        }),
      }),
    ]);
  });
});
