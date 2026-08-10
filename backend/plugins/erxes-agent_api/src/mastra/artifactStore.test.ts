import type {
  Artifact,
  DocumentArtifact,
  WebsiteArtifact,
} from '~/mastra/tools/artifacts';

const recordArtifact = jest.fn();
const recordArtifacts = jest.fn();
const recordStoredArtifacts = jest.fn();
const recordStoredWebsiteArtifacts = jest.fn();
const getCurrentAuth = jest.fn();

jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn(async () => ({
    MastraArtifact: { recordArtifact, recordArtifacts },
  })),
}));

jest.mock('~/mastra/requestContext', () => ({
  getCurrentAuth: () => getCurrentAuth(),
  recordStoredArtifacts: (...args: unknown[]) => recordStoredArtifacts(...args),
  recordStoredWebsiteArtifacts: (...args: unknown[]) =>
    recordStoredWebsiteArtifacts(...args),
}));

const { storeArtifact, storeArtifacts, storeWebsiteArtifact } =
  require('~/mastra/artifactStore') as {
    storeArtifact: (artifact: Artifact) => Promise<void>;
    storeArtifacts: (artifacts: Artifact[]) => Promise<void>;
    storeWebsiteArtifact: (
      artifact: WebsiteArtifact,
      files: Array<{
        path: string;
        fileKey: string;
        mimeType: string;
        size: number;
        sha256: string;
      }>,
    ) => Promise<void>;
  };

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
    recordArtifacts.mockReset();
    recordStoredArtifacts.mockReset();
    recordStoredWebsiteArtifacts.mockReset();
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
    expect(recordStoredArtifacts).toHaveBeenCalledWith(1);
  });

  it('persists one terminal preview batch in one model call', async () => {
    const second = { ...pptx, id: 'doc_deck_2', title: 'Second deck' };

    await storeArtifacts([pptx, second]);

    expect(recordArtifact).not.toHaveBeenCalled();
    expect(recordArtifacts).toHaveBeenCalledTimes(1);
    expect(recordArtifacts).toHaveBeenCalledWith([
      expect.objectContaining({ artifactId: 'doc_deck' }),
      expect.objectContaining({ artifactId: 'doc_deck_2' }),
    ]);
    expect(recordStoredArtifacts).toHaveBeenCalledWith(2);
  });

  it('persists an immutable website manifest in the artifact record', async () => {
    const website: WebsiteArtifact = {
      id: 'site_1',
      kind: 'website',
      title: 'Launch',
      entryPath: 'index.html',
      fileCount: 1,
      contentHash: 'a'.repeat(64),
      previewToken: 'preview-token',
      fileName: 'index.html',
      mimeType: 'text/html; charset=utf-8',
      fileKey: 'private/site/index.html',
      size: 15,
      inline: false,
    };
    const files = [
      {
        path: 'index.html',
        fileKey: 'private/site/index.html',
        mimeType: 'text/html; charset=utf-8',
        size: 15,
        sha256: 'b'.repeat(64),
      },
    ];

    await storeWebsiteArtifact(website, files);

    expect(recordArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        artifactId: 'site_1',
        kind: 'website',
        contentHash: 'a'.repeat(64),
        websiteFiles: files,
      }),
    );
    expect(recordStoredArtifacts).toHaveBeenCalledWith(1);
    expect(recordStoredWebsiteArtifacts).toHaveBeenCalledWith(1);
  });

  it('skips recording when there is no active chat turn', async () => {
    getCurrentAuth.mockReturnValue(undefined);
    await storeArtifact(pptx);
    await storeArtifacts([pptx]);
    expect(recordArtifact).not.toHaveBeenCalled();
    expect(recordArtifacts).not.toHaveBeenCalled();
    expect(recordStoredArtifacts).not.toHaveBeenCalled();
    expect(recordStoredWebsiteArtifacts).not.toHaveBeenCalled();
  });
});
