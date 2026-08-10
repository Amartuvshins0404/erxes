import { createHash } from 'node:crypto';
import { createTool } from '@mastra/core/tools';
import { ExpectedError } from 'erxes-api-shared/utils';
import { z } from 'zod';
import type { IModels } from '~/connectionResolvers';
import { writeAgentAction } from '~/mastra/auditLog';
import { storeWebsiteArtifact } from '~/mastra/artifactStore';
import { getCurrentAuth } from '~/mastra/requestContext';
import { deleteWebsiteFiles } from '~/mastra/files/websiteFileStore';
import {
  captureSandboxWebsite,
  writeSandboxWorkspaceFiles,
} from '~/mastra/sandbox/commandService';
import { websiteArtifactSchema } from './artifacts';
import { publishPreviewWebsite } from './previewPublisher';

const stableThreadId = (value: string): string =>
  value.length <= 256
    ? value
    : `sha256:${createHash('sha256').update(value).digest('hex')}`;

const workspaceContext = (agentId: string) => {
  const auth = getCurrentAuth();
  if (!auth?.subdomain || auth.agentId !== agentId) {
    throw new ExpectedError('Workspace execution context is invalid.');
  }
  const requestThreadId = auth.threadId || auth.resourceId || auth.turnId;
  if (!requestThreadId) {
    throw new ExpectedError(
      'Workspace operations require an agent turn context.',
    );
  }
  return {
    auth,
    identity: {
      agentId,
      threadId: stableThreadId(requestThreadId),
      subdomain: auth.subdomain,
    },
    auditPrincipal: { source: 'chat' as const, agentId },
  };
};

const cwdSchema = z
  .string()
  .trim()
  .max(512)
  .optional()
  .describe('Workspace-relative working directory. Defaults to the root.');

const workspaceWriteOutputSchema = z.object({
  cwd: z.string(),
  workspaceReused: z.boolean(),
  files: z.array(
    z.object({
      path: z.string(),
      size: z.number().int().nonnegative(),
    }),
  ),
});

export const createWorkspaceWriteTool = ({
  models,
  agentId,
}: {
  models: IModels;
  agentId: string;
}) =>
  createTool({
    id: 'workspace-write',
    description:
      'Write complete UTF-8 source files into this AI team member’s isolated persistent workspace. ' +
      'Use this instead of shell heredocs, base64, printf, or oversized terminal commands. ' +
      'Parent directories are created automatically.',
    inputSchema: z.object({
      cwd: cwdSchema,
      files: z
        .array(
          z.object({
            path: z
              .string()
              .trim()
              .min(1)
              .max(500)
              .describe('File path relative to cwd.'),
            content: z
              .string()
              .max(1024 * 1024)
              .describe('Complete UTF-8 file content.'),
          }),
        )
        .min(1)
        .max(32),
    }),
    outputSchema: workspaceWriteOutputSchema,
    execute: async (input) => {
      const { identity, auditPrincipal } = workspaceContext(agentId);
      const pathHashes = input.files.map((file) => ({
        path: file.path,
        sha256: createHash('sha256').update(file.content).digest('hex'),
      }));
      try {
        const result = await writeSandboxWorkspaceFiles(
          models,
          identity,
          input,
        );
        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'sandboxWorkspaceWrite',
          operationType: 'terminal',
          destructive: true,
          args: { cwd: result.cwd, files: pathHashes },
          status: 'success',
        });
        return result;
      } catch (error) {
        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'sandboxWorkspaceWrite',
          operationType: 'terminal',
          destructive: true,
          args: { cwd: input.cwd, files: pathHashes },
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown error',
        });
        if (error instanceof ExpectedError) throw error;
        throw new ExpectedError(
          'Could not write files to the isolated workspace. Please try again.',
        );
      }
    },
  });

export const createPublishWebsiteTool = ({
  models,
  agentId,
}: {
  models: IModels;
  agentId: string;
}) => {
  let publishAttemptedTurnId: string | undefined;
  return createTool({
    id: 'publish-website',
    description:
      'Publish one completed static website directory from the persistent workspace as one immutable chat artifact. ' +
      'Run the build first when needed. The directory must contain every HTML, CSS, JavaScript, image, and font asset; never start a server or use localhost URLs.',
    inputSchema: z.object({
      cwd: cwdSchema,
      root: z
        .string()
        .trim()
        .min(1)
        .max(500)
        .describe('Ready-to-serve website directory relative to cwd.'),
      entry: z
        .string()
        .trim()
        .min(1)
        .max(500)
        .optional()
        .describe('Entry HTML path inside root. Defaults to index.html.'),
      title: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .optional()
        .describe('Website title shown in chat.'),
    }),
    outputSchema: z.object({ artifact: websiteArtifactSchema }),
    execute: async (input) => {
      const { auth, identity, auditPrincipal } = workspaceContext(agentId);
      if (auth.turnId && publishAttemptedTurnId === auth.turnId) {
        throw new ExpectedError(
          'Website publishing already ran in this turn. Do not retry it until the next user turn.',
        );
      }
      publishAttemptedTurnId = auth.turnId;
      try {
        const captured = await captureSandboxWebsite(models, identity, input);
        const published = await publishPreviewWebsite(models, captured.website);
        await storeWebsiteArtifact(published.artifact, published.files).catch(
          async () => {
            await deleteWebsiteFiles(
              models,
              published.files.map((file) => file.fileKey),
            );
            throw new ExpectedError(
              'Website metadata could not be saved. Do not retry this turn.',
            );
          },
        );
        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'sandboxWebsitePublish',
          operationType: 'terminal',
          destructive: true,
          args: {
            cwd: captured.cwd,
            root: input.root,
            entry: published.artifact.entryPath,
            contentHash: published.artifact.contentHash,
            fileCount: published.files.length,
          },
          status: 'success',
        });
        return { artifact: published.artifact };
      } catch (error) {
        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'sandboxWebsitePublish',
          operationType: 'terminal',
          destructive: true,
          args: { cwd: input.cwd, root: input.root, entry: input.entry },
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown error',
        });
        if (error instanceof ExpectedError) throw error;
        throw new ExpectedError(
          'Website publishing failed. Do not retry this turn.',
        );
      }
    },
  });
};
