import type { DocumentArtifact } from '~/mastra/tools/artifacts';

const recordArtifact = jest.fn();
const getCurrentAuth = jest.fn();

jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn(async () => ({
    MastraArtifact: { recordArtifact },
  })),
}));

jest.mock('~/mastra/requestContext', () => ({
  getCurrentAuth: () => getCurrentAuth(),
}));

const { storeArtifact }: typeof import('~/mastra/artifactStore') =
  require('~/mastra/artifactStore');

const pptx: DocumentArtifact = {
  id: 'doc_deck',
  kind: 'document',
  format: 'pptx',
  title: 'Deck',
  fileName: 'deck.pptx',
  mimeType:
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  fileKey: 'key/deck.pptx',
  slides: ['key/s1.png', 'key/s2.png', 'key/s3.png'],
  slideCount: 3,
};

describe('storeArtifact', () => {
  beforeEach(() => {
    recordArtifact.mockReset();
    getCurrentAuth.mockReset();
    getCurrentAuth.mockReturnValue({ subdomain: 'test', threadId: 't1' });
  });

  // Regression for EDGEART-007: a persisted pptx deck used to drop its slide
  // refs + count, so Present mode + the slide images vanished after reload. The
  // record must now carry slides/slideCount through to the store.
  it('persists pptx slides + slideCount', async () => {
    await storeArtifact(pptx);

    expect(recordArtifact).toHaveBeenCalledTimes(1);
    expect(recordArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactId: 'doc_deck',
        kind: 'document',
        format: 'pptx',
        slides: ['key/s1.png', 'key/s2.png', 'key/s3.png'],
        slideCount: 3,
      }),
    );
  });

  it('skips recording when there is no active chat turn', async () => {
    getCurrentAuth.mockReturnValue(undefined);
    await storeArtifact(pptx);
    expect(recordArtifact).not.toHaveBeenCalled();
  });
});
