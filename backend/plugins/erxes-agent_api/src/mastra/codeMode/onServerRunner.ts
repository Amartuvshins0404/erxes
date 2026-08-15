import vm from 'node:vm';
import { ExpectedError } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import { getNativeToolRegistry } from '~/mastra/tools/nativeTools';
import type {
  CodeExecutionAuth,
  CodeExecutionResult,
} from './runCode';
import { executeCodeModeCall } from './runCode';

const MAX_LOG_LINES = 200;
const MAX_LOG_LINE_CHARS = 1000;
// Covers synchronous compile + the sync head of the async body (up to the
// first await); async completion is bounded by the caller's timeout race.
const VM_BOOT_TIMEOUT_MS = 5_000;
const DEFAULT_TIMEOUT_SECONDS = 30;
const MAX_SET_TIMEOUT_MS = 10_000;

export interface OnServerCodeInput {
  models: IModels;
  auth: CodeExecutionAuth;
  code: string;
  timeoutSeconds?: number;
}

const formatLogValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const appendLog = (logs: string[], args: unknown[]): void => {
  if (logs.length >= MAX_LOG_LINES) return;
  logs.push(args.map(formatLogValue).join(' ').slice(0, MAX_LOG_LINE_CHARS));
};

const jsonSafe = (value: unknown): unknown => {
  if (value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const sanitizeError = (error: unknown): string => {
  // vm realm errors are not host `Error` instances — duck-type the message.
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
};

// Same cross-realm rule for class checks: `instanceof SyntaxError` is always
// false for errors thrown by vm compilation, so match on the error name.
const isSyntaxError = (error: unknown): boolean =>
  Boolean(error) &&
  typeof error === 'object' &&
  (error as { name?: unknown }).name === 'SyntaxError';

/**
 * Run LLM-written async JavaScript in a fresh node:vm realm. The realm gets
 * only the `erxes` host bridge, a capped console, and a bounded setTimeout —
 * the vm's own intrinsics (JSON/Math/Date/Object/Array/Promise) come from the
 * new realm itself; there is no process, require, fetch, or Buffer.
 */
export const runCodeOnServer = async ({
  models,
  auth,
  code,
  timeoutSeconds,
}: OnServerCodeInput): Promise<CodeExecutionResult> => {
  const registry = await getNativeToolRegistry(auth.subdomain, { models });
  const tools = registry.list.map((descriptor) => ({
    id: descriptor.id,
    kind: descriptor.kind,
    plugin: descriptor.plugin,
    module: descriptor.module,
    method: descriptor.method,
    description: descriptor.description,
  }));

  const logs: string[] = [];

  // Sequential-only bridge: concurrent erxes.call invocations queue behind
  // each other instead of racing the capability layer.
  let tail: Promise<unknown> = Promise.resolve();
  const erxes = Object.freeze({
    list: () => tools.map((tool) => ({ ...tool })),
    call: (toolId: unknown, input?: Record<string, unknown>) => {
      if (typeof toolId !== 'string' || !toolId.trim()) {
        return Promise.reject(new Error('erxes.call requires a tool id.'));
      }
      const execute = (): Promise<unknown> => {
        const descriptor = registry.tools.get(toolId);
        return executeCodeModeCall({
          auth,
          toolId,
          input,
          isMutation: descriptor?.method === 'mutation',
          models,
        });
      };
      const next = tail.then(execute);
      tail = next.catch(() => undefined);
      return next;
    },
  });

  const sandboxConsole = Object.freeze({
    log: (...args: unknown[]) => appendLog(logs, args),
    info: (...args: unknown[]) => appendLog(logs, args),
    warn: (...args: unknown[]) => appendLog(logs, args),
    error: (...args: unknown[]) => appendLog(logs, args),
  });

  const context = vm.createContext(
    { erxes, console: sandboxConsole, setTimeout: boundedSetTimeout, clearTimeout },
    { codeGeneration: { strings: false, wasm: false } },
  );

  // Prefer last-expression semantics when the whole snippet is one
  // expression; otherwise run it as an async function body where an explicit
  // `return` produces the result.
  const expressionSource = `(async () => (\n${code}\n))()`;
  const statementSource = `(async () => {\n${code}\n})()`;

  let started: Promise<unknown>;
  try {
    started = runSource(expressionSource, context);
  } catch (error) {
    if (!isSyntaxError(error)) {
      return { result: null, logs, error: sanitizeError(error) };
    }
    try {
      started = runSource(statementSource, context);
    } catch (statementError) {
      return { result: null, logs, error: sanitizeError(statementError) };
    }
  }

  const timeoutMs = (timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS) * 1000;
  let timer: NodeJS.Timeout | undefined;
  try {
    const value = await Promise.race([
      started,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new ExpectedError('Code execution timed out')),
          timeoutMs,
        );
      }),
    ]);
    return { result: jsonSafe(value), logs };
  } catch (error) {
    if (error instanceof ExpectedError) throw error;
    return { result: null, logs, error: sanitizeError(error) };
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const boundedSetTimeout = (
  callback: (...args: unknown[]) => void,
  delay?: unknown,
): NodeJS.Timeout => {
  const ms = Math.min(Math.max(Number(delay) || 0, 0), MAX_SET_TIMEOUT_MS);
  return setTimeout(callback, ms);
};

// node:vm boundary: runInNewContext returns `any` (the realm's thenable).
const runSource = (
  source: string,
  context: vm.Context,
): Promise<unknown> => {
  const value: unknown = vm.runInNewContext(source, context, {
    timeout: VM_BOOT_TIMEOUT_MS,
  });
  return Promise.resolve(value);
};
