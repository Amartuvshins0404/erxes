import { createHash } from 'node:crypto';
import { createTool } from '@mastra/core/tools';
import { ExpectedError } from 'erxes-api-shared/utils';
import { z } from 'zod';
import type { IModels } from '~/connectionResolvers';
import { writeAgentAction } from '~/mastra/auditLog';
import { runAgentCode } from '~/mastra/codeMode/runCode';
import { getCurrentAuth } from '~/mastra/requestContext';

const CODE_MODE_DESCRIPTION =
  'Execute JavaScript code with access to the erxes SDK. The code runs as an ' +
  'async function body: use `return <value>` to produce the result (a single ' +
  'bare expression also works). Inside the code a global `erxes` object is ' +
  'available:\n' +
  '- `await erxes.call(toolId, input)` — call any native erxes capability ' +
  '(e.g. "sales.model.Deals.find") with a plain-object input; returns a ' +
  'Promise of the capability result. Calls execute as you with full ' +
  'server-side permission checks; destructive capabilities may be blocked or ' +
  'require approval at the capability layer.\n' +
  '- `erxes.list()` — returns an array of { id, kind, plugin, module, method, ' +
  'description } for every native capability available to you.\n' +
  '`console.log/info/warn/error` output is captured and returned in `logs`. ' +
  'Await erxes.call invocations sequentially (no Promise.all over them). ' +
  'There is no network, filesystem, or process access inside the sandbox.';

const codeModeOutputSchema = z.object({
  result: z.unknown(),
  logs: z.array(z.string()),
  error: z.string().optional(),
});

const stableThreadId = (value: string): string =>
  value.length <= 256
    ? value
    : `sha256:${createHash('sha256').update(value).digest('hex')}`;

export const createCodeModeTool = ({
  models,
  agentId,
}: {
  models: IModels;
  agentId: string;
}) =>
  createTool({
    id: 'run-code',
    description: CODE_MODE_DESCRIPTION,
    inputSchema: z.object({
      code: z
        .string()
        .min(1)
        .max(32_000)
        .describe(
          'JavaScript async function body to execute. Use erxes.call/erxes.list and return the final value.',
        ),
      timeoutSeconds: z
        .number()
        .int()
        .min(1)
        .max(120)
        .optional()
        .describe('Execution timeout in seconds. Defaults to 30.'),
    }),
    outputSchema: codeModeOutputSchema,
    execute: async (input) => {
      const auth = getCurrentAuth();
      const userId = auth?.principalUserId?.trim();
      if (!auth?.subdomain || auth.agentId !== agentId || !userId) {
        throw new ExpectedError('Code execution context is invalid.');
      }
      const requestThreadId = auth.threadId || auth.resourceId || auth.turnId;
      if (!requestThreadId) {
        throw new ExpectedError(
          'Code execution requires an agent turn context.',
        );
      }

      const settings = await models.MastraSettings.getSettings();
      const sandboxMode = settings.sandboxMode ?? 'onserver';
      const codeHash = createHash('sha256').update(input.code).digest('hex');
      const auditPrincipal = { source: 'chat' as const, agentId };
      try {
        const result = await runAgentCode({
          models,
          settings,
          identity: {
            agentId,
            threadId: stableThreadId(requestThreadId),
            subdomain: auth.subdomain,
          },
          auth: { subdomain: auth.subdomain, userId },
          code: input.code,
          timeoutSeconds: input.timeoutSeconds,
        });
        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'agentCodeExecute',
          operationType: 'code',
          destructive: true,
          args: {
            codeHash,
            sandboxMode,
            timeoutSeconds: input.timeoutSeconds,
          },
          status: result.error ? 'failed' : 'success',
          error: result.error,
        });
        return result;
      } catch (error) {
        writeAgentAction(models, {
          ...auditPrincipal,
          operation: 'agentCodeExecute',
          operationType: 'code',
          destructive: true,
          args: {
            codeHash,
            sandboxMode,
            timeoutSeconds: input.timeoutSeconds,
          },
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown error',
        });
        throw error;
      }
    },
  });
