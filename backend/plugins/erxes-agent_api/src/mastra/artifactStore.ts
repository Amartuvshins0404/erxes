import { generateModels } from '~/connectionResolvers';
import { getCurrentAuth } from '~/mastra/requestContext';
import type { Artifact } from '~/mastra/tools/artifacts';

// Persist a tool-produced artifact (chart / document) to its own collection so
// it reliably survives reloads and powers the Preview panel's per-thread file
// list — independent of the fragile native-store message meta. Best-effort:
// a failure here never affects the tool result the user sees.
export async function storeArtifact(artifact: Artifact): Promise<void> {
  const auth = getCurrentAuth();
  // Only inside a chat turn (no threadId → e.g. a workflow run) do we record.
  if (!auth?.subdomain || !auth?.threadId) return;

  try {
    const models = await generateModels(auth.subdomain);
    await models.MastraArtifact.recordArtifact({
      artifactId: artifact.id,
      threadId: auth.threadId,
      turnId: auth.turnId,
      prompt: auth.turnPrompt,
      resourceId: auth.resourceId,
      kind: artifact.kind,
      title: artifact.title,
      ...(artifact.kind === 'chart'
        ? { spec: artifact.spec as unknown as Record<string, unknown> }
        : artifact.kind === 'diagram'
          ? { definition: artifact.definition }
          : {
              format: artifact.format,
              fileName: artifact.fileName,
              mimeType: artifact.mimeType,
              fileKey: artifact.fileKey,
              inline: artifact.inline,
              size: artifact.size,
            }),
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(
      `[artifact-store] record skipped: ${(e as Error)?.message || e}`,
    );
  }
}
