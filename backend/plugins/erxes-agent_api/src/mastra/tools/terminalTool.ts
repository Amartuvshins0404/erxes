import { createHash } from 'node:crypto';
import { createTool } from '@mastra/core/tools';
import { ExpectedError } from 'erxes-api-shared/utils';
import { z } from 'zod';
import type { IModels } from '~/connectionResolvers';
import { writeAgentAction } from '~/mastra/auditLog';
import { storeArtifacts } from '~/mastra/artifactStore';
import { getCurrentAuth } from '~/mastra/requestContext';
import {
  runSandboxCommand,
  TERMINAL_COMMAND_MAX_BYTES,
} from '~/mastra/sandbox/commandService';
import type { Artifact } from './artifacts';
import { artifactSchema } from './artifacts';
import { publishPreviewFiles } from './previewPublisher';

const terminalResultSchema = z.object({
  cwd: z.string(),
  exitCode: z.number().int().nullable(),
  stdout: z.string(),
  stderr: z.string(),
  durationMs: z.number(),
  truncated: z.boolean(),
  workspaceReused: z.boolean(),
});

const terminalOutputSchema = terminalResultSchema.extend({
  artifacts: z.array(artifactSchema),
});

const stableThreadId = (value: string): string =>
  value.length <= 256
    ? value
    : `sha256:${createHash('sha256').update(value).digest('hex')}`;

export const createTerminalTool = ({
  models,
  agentId,
}: {
  models: IModels;
  agentId: string;
}) =>
  createTool({
    id: 'terminal',
    description:
      'Run a short build, test, or inspection command in this AI team member’s isolated persistent workspace. ' +
      'Write source files with workspaceWrite; publish a completed static site with publishWebsite. ' +
      'Use previewPaths only for standalone documents. The workspace has no erxes credentials or network access and is reused within the current chat thread.',
    inputSchema: z.object({
      command: z
        .string()
        .min(1)
        .max(TERMINAL_COMMAND_MAX_BYTES)
        .describe('Shell command to execute.'),
      cwd: z
        .string()
        .max(512)
        .optional()
        .describe(
          'Workspace-relative working directory. Defaults to the root.',
        ),
      timeoutSeconds: z
        .number()
        .int()
        .min(1)
        .max(120)
        .default(30)
        .describe('Execution timeout in seconds.'),
      previewPaths: z
        .array(z.string().trim().min(1).max(500))
        .max(8)
        .optional()
        .describe(
          'Standalone output files to publish in chat, relative to cwd.',
        ),
    }),
    outputSchema: terminalOutputSchema,
    execute: async (input) => {
      const auth = getCurrentAuth();
      if (!auth?.subdomain || auth.agentId !== agentId) {
        throw new ExpectedError('Terminal execution context is invalid.');
      }
      const requestThreadId = auth.threadId || auth.resourceId || auth.turnId;
      if (!requestThreadId) {
        throw new ExpectedError(
          'Terminal execution requires a chat or workflow context.',
        );
      }

      const commandHash = createHash('sha256')
        .update(input.command)
        .digest('hex');
      const auditPrincipal = auth.background
        ? {
            source: 'workflow' as const,
            workflowId: auth.resourceId,
            agentId,
          }
        : { source: 'chat' as const, agentId };
      try {
        const result = await runSandboxCommand(
          models,
          {
            agentId,
            threadId: stableThreadId(requestThreadId),
            subdomain: auth.subdomain,
          },
          input,
        );
        const { previewFiles = [], ...commandResult } = result;
        const artifacts: Artifact[] = await publishPreviewFiles(previewFiles);
        await storeArtifacts(artifacts);

        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'sandboxTerminalExecute',
          operationType: 'terminal',
          destructive: true,
          args: {
            commandHash,
            cwd: commandResult.cwd,
            timeoutSeconds: input.timeoutSeconds,
            previewFileCount: artifacts.length,
          },
          status: commandResult.exitCode === 0 ? 'success' : 'failed',
          error:
            commandResult.exitCode === 0
              ? undefined
              : `exit ${commandResult.exitCode}`,
        });
        return { ...commandResult, artifacts };
      } catch (error) {
        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'sandboxTerminalExecute',
          operationType: 'terminal',
          destructive: true,
          args: {
            commandHash,
            timeoutSeconds: input.timeoutSeconds,
            previewFileCount: input.previewPaths?.length ?? 0,
          },
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown error',
        });
        if (error instanceof ExpectedError) throw error;
        console.error(
          '[erxes-agent:terminal] OpenSandbox command failed',
          error,
        );
        throw new ExpectedError(
          'The isolated terminal is unavailable. Check OpenSandbox health and configuration.',
        );
      }
    },
  });
