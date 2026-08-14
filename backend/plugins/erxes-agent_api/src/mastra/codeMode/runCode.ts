import type { IModels } from '~/connectionResolvers';
import type { IMastraSettings } from '@/settings/@types/settings';
import type { SandboxSessionIdentity } from '~/mastra/sandbox/commandService';
import { makeAgentProcessId } from '~/mastra/auditLog';
import { runMutationSerially, runToolOnce } from '~/mastra/requestContext';
import { callNativeTool } from '~/mastra/tools/nativeTools';
import { runCodeIsolated } from './isolatedRunner';
import { runCodeOnServer } from './onServerRunner';

/** Acting identity the sandboxed `erxes.call` bridge executes as. */
export interface CodeExecutionAuth {
  subdomain: string;
  userId: string;
}

/** The run-code tool's output envelope. */
export interface CodeExecutionResult {
  result: unknown;
  logs: string[];
  error?: string;
}

export interface RunAgentCodeInput {
  models: IModels;
  settings: IMastraSettings;
  identity: SandboxSessionIdentity;
  auth: CodeExecutionAuth;
  code: string;
  timeoutSeconds?: number;
}

// Same 64KB discipline as the terminal output cap.
const OUTPUT_LIMIT_BYTES = 64 * 1024;

const serializedBytes = (value: unknown): number =>
  Buffer.byteLength(JSON.stringify(value));

/**
 * Keep the whole serialized envelope under 64KB: drop trailing log lines
 * first, then fall back to a truncated string form of an oversized result.
 */
const capCodeOutput = (output: CodeExecutionResult): CodeExecutionResult => {
  const envelope = (
    result: unknown,
    logs: string[],
  ): CodeExecutionResult => ({
    result,
    logs,
    ...(output.error ? { error: output.error } : {}),
  });

  if (serializedBytes(envelope(output.result, output.logs)) <= OUTPUT_LIMIT_BYTES) {
    return envelope(output.result, output.logs);
  }

  const logs = [...output.logs];
  while (logs.length && serializedBytes(envelope(output.result, logs)) > OUTPUT_LIMIT_BYTES) {
    logs.pop();
  }
  if (logs.length !== output.logs.length) {
    logs.push('[truncated: output exceeded the 64KB limit]');
  }
  if (serializedBytes(envelope(output.result, logs)) <= OUTPUT_LIMIT_BYTES) {
    return envelope(output.result, logs);
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(output.result) ?? String(output.result);
  } catch {
    serialized = String(output.result);
  }
  const truncated =
    serialized.slice(0, OUTPUT_LIMIT_BYTES / 2) +
    '… [truncated: result exceeded the 64KB limit]';
  return envelope(truncated, logs);
};

/**
 * Execute one sandboxed `erxes.call` through the same per-turn controls as
 * any standalone tool: every invocation spends from the turn's tool-call
 * budget, exact repeats share the first promise, and mutations join the
 * turn-wide serial queue.
 */
export const executeCodeModeCall = async (opts: {
  auth: CodeExecutionAuth;
  toolId: string;
  input?: Record<string, unknown>;
  isMutation: boolean;
}): Promise<unknown> => {
  const { auth, toolId, input, isMutation } = opts;
  return runToolOnce(`run-code:${toolId}`, input ?? {}, () => {
    const execute = () =>
      callNativeTool({
        subdomain: auth.subdomain,
        userId: auth.userId,
        processId: isMutation ? makeAgentProcessId() : undefined,
        toolId,
        input,
      });
    return isMutation ? runMutationSerially(execute) : execute();
  });
};

/**
 * Dispatch one code-mode execution to the configured sandbox backend.
 * 'isolated' without OpenSandbox configuration fails through the existing
 * config resolution path inside the sandbox command service.
 */
export const runAgentCode = async (
  input: RunAgentCodeInput,
): Promise<CodeExecutionResult> => {
  const mode = input.settings.sandboxMode ?? 'onserver';
  const output =
    mode === 'isolated'
      ? await runCodeIsolated(input)
      : await runCodeOnServer(input);
  return capCodeOutput(output);
};
