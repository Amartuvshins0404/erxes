import { generateModels } from '~/connectionResolvers';
import {
  getCurrentAuth,
  recordStoredArtifacts,
  recordStoredWebsiteArtifacts,
} from '~/mastra/requestContext';
import type { Artifact, WebsiteArtifact } from '~/mastra/tools/artifacts';
import type {
  IMastraArtifact,
  IWebsiteFileReference,
} from '@/artifact/@types/artifact';

interface ActiveArtifactContext {
  subdomain: string;
  threadId: string;
  turnId?: string;
  turnPrompt?: string;
  resourceId?: string;
  initiatorUserId?: string;
}

const activeArtifactContext = (): ActiveArtifactContext | null => {
  const auth = getCurrentAuth();
  if (!auth?.subdomain || !auth.threadId) return null;
  return {
    subdomain: auth.subdomain,
    threadId: auth.threadId,
    turnId: auth.turnId,
    turnPrompt: auth.turnPrompt,
    resourceId: auth.resourceId,
    initiatorUserId: auth.initiatorUserId,
  };
};

const toArtifactRecord = (
  artifact: Artifact,
  auth: ActiveArtifactContext,
): IMastraArtifact => ({
  artifactId: artifact.id,
  threadId: auth.threadId,
  turnId: auth.turnId,
  prompt: auth.turnPrompt,
  resourceId: auth.resourceId,
  initiatorUserId: auth.initiatorUserId,
  kind: artifact.kind,
  title: artifact.title,
  ...(artifact.kind === 'chart'
    ? { spec: artifact.spec as unknown as Record<string, unknown> }
    : artifact.kind === 'diagram'
    ? { definition: artifact.definition }
    : artifact.kind === 'image'
    ? {
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        fileKey: artifact.fileKey,
        inline: artifact.inline,
        size: artifact.size,
        width: artifact.width,
        height: artifact.height,
      }
    : artifact.kind === 'website'
    ? {
        entryPath: artifact.entryPath,
        fileCount: artifact.fileCount,
        contentHash: artifact.contentHash,
        previewToken: artifact.previewToken,
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        fileKey: artifact.fileKey,
        inline: artifact.inline,
        size: artifact.size,
      }
    : {
        format: artifact.format,
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        fileKey: artifact.fileKey,
        inline: artifact.inline,
        size: artifact.size,
        slides: artifact.slides,
        slideCount: artifact.slideCount,
      }),
});

const persistArtifacts = async (
  artifacts: Artifact[],
  batched: boolean,
  websiteManifest?: {
    artifactId: string;
    files: IWebsiteFileReference[];
  },
  strict = false,
): Promise<void> => {
  if (!artifacts.length) return;
  const auth = activeArtifactContext();
  // Only inside a chat turn do we record.
  if (!auth) {
    if (strict) throw new Error('Website artifact context is unavailable.');
    return;
  }

  try {
    const models = await generateModels(auth.subdomain);
    const records = artifacts.map((artifact) => {
      const record = toArtifactRecord(artifact, auth);
      if (websiteManifest?.artifactId === artifact.id) {
        record.websiteFiles = websiteManifest.files;
      }
      return record;
    });
    if (batched) {
      await models.MastraArtifact.recordArtifacts(records);
    } else {
      await models.MastraArtifact.recordArtifact(records[0]);
    }
    recordStoredArtifacts(records.length);
    recordStoredWebsiteArtifacts(
      records.filter((record) => record.kind === 'website').length,
    );
  } catch (error) {
    if (strict) throw error;
    // Best-effort: a metadata failure never hides the tool result from the user.
    console.warn(
      `[artifact-store] record skipped: ${(error as Error)?.message || error}`,
    );
  }
};

export const storeArtifact = async (artifact: Artifact): Promise<void> =>
  persistArtifacts([artifact], false);

/** Persist one terminal command's preview metadata in one MongoDB round-trip. */
export const storeArtifacts = async (artifacts: Artifact[]): Promise<void> =>
  persistArtifacts(artifacts, true);

/** Persist one website card plus its private member-file manifest. */
export const storeWebsiteArtifact = async (
  artifact: WebsiteArtifact,
  files: IWebsiteFileReference[],
): Promise<void> =>
  persistArtifacts(
    [artifact],
    false,
    {
      artifactId: artifact.id,
      files,
    },
    true,
  );
