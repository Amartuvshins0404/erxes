import { ExpectedError } from 'erxes-api-shared/utils';
import type { IModels } from '~/connectionResolvers';
import type { IMastraSettings } from '@/settings/@types/settings';
import {
  runSandboxCommand,
  writeSandboxWorkspaceFiles,
  type SandboxSessionIdentity,
} from '~/mastra/sandbox/commandService';
import { resolveOpenSandboxRuntimeConfig } from '~/mastra/sandbox/config';
import {
  getNativeToolRegistry,
  type NativeToolRegistry,
} from '~/mastra/tools/nativeTools';
import type {
  CodeExecutionAuth,
  CodeExecutionResult,
} from './runCode';
import { executeCodeModeCall } from './runCode';

export interface IsolatedCodeInput {
  models: IModels;
  settings: IMastraSettings;
  identity: SandboxSessionIdentity;
  auth: CodeExecutionAuth;
  code: string;
  timeoutSeconds?: number;
}

const CODE_MODE_DIR = '.code-mode';
const PROTOCOL_PREFIX = '__ERXES_CODE_MODE__:';
const MAX_BRIDGE_CALLS = 32;
const MAX_BRIDGE_RESULT_BYTES = 256 * 1024;
const DEFAULT_TIMEOUT_SECONDS = 30;

interface BridgeCallRecord {
  index: number;
  toolId: string;
  input: unknown;
  status: 'pending' | 'done' | 'error';
  data?: unknown;
  error?: string;
}

interface BridgeState {
  tools: Array<Record<string, unknown>>;
  calls: BridgeCallRecord[];
  timeBase: number;
}

interface ShimRequest {
  index: number;
  toolId: string;
  input: unknown;
}

// In-sandbox runner (plain CommonJS — the container has no build step).
// It executes the user code with a deterministic clock/random and a memoized
// erxes bridge: each round replays previously answered calls from state.json
// and suspends at the first unanswered one, printing the request as a
// protocol line on stdout. The host answers it and re-runs, so the sandbox
// never needs network access or stdin. Keep this free of template
// placeholders — it is embedded in a TS template literal below.
const SHIM_SOURCE = [
  "'use strict';",
  'const fs = require("fs");',
  'const path = require("path");',
  'const STATE_PATH = path.join(__dirname, "state.json");',
  'const CODE_PATH = path.join(__dirname, "code.js");',
  'const PROTOCOL_PREFIX = "__ERXES_CODE_MODE__:";',
  'const MAX_LOG_LINES = 200;',
  'const MAX_LOG_LINE_CHARS = 1000;',
  '',
  'const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));',
  'const calls = Array.isArray(state.calls) ? state.calls : [];',
  'const tools = Array.isArray(state.tools) ? state.tools : [];',
  '',
  'const logs = [];',
  'const formatValue = (value) => {',
  '  if (typeof value === "string") return value;',
  '  try { return JSON.stringify(value); } catch { return String(value); }',
  '};',
  'const sandboxConsole = {};',
  'for (const level of ["log", "info", "warn", "error"]) {',
  '  sandboxConsole[level] = (...args) => {',
  '    if (logs.length >= MAX_LOG_LINES) return;',
  '    logs.push(args.map(formatValue).join(" ").slice(0, MAX_LOG_LINE_CHARS));',
  '  };',
  '}',
  '',
  '// Deterministic time and randomness so memoized replay rounds observe',
  '// identical sequences; divergent code fails the recorded-call check.',
  'let clockTick = 0;',
  'const timeBase = typeof state.timeBase === "number" ? state.timeBase : 0;',
  'const RealDate = Date;',
  'class ReplayDate extends RealDate {',
  '  constructor(...args) {',
  '    if (args.length === 0) { super(timeBase + ++clockTick); } else { super(...args); }',
  '  }',
  '  static now() { return timeBase + ++clockTick; }',
  '}',
  'let randomState = 0x2f6e2b1;',
  'const deterministicRandom = () => {',
  '  randomState |= 0; randomState = (randomState + 0x6d2b79f5) | 0;',
  '  let t = Math.imul(randomState ^ (randomState >>> 15), 1 | randomState);',
  '  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;',
  '  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;',
  '};',
  'const replayMath = Object.create(Math);',
  'replayMath.random = deterministicRandom;',
  '',
  'class CodeModeSuspend extends Error {}',
  '',
  'let callIndex = 0;',
  'const erxes = Object.freeze({',
  '  list: () => tools.map((tool) => ({ ...tool })),',
  '  call: (toolId, input) => {',
  '    const index = callIndex++;',
  '    const recorded = calls[index];',
  '    if (recorded) {',
  '      const sameRequest =',
  '        recorded.toolId === toolId &&',
  '        JSON.stringify(recorded.input === undefined ? null : recorded.input) ===',
  '          JSON.stringify(input === undefined ? null : input);',
  '      if (!sameRequest) {',
  '        return Promise.reject(new Error(',
  '          "Code is not deterministic across erxes.call replays: call #" +',
  '            (index + 1) +',
  '            " changed between rounds. Keep call inputs stable (the sandbox provides a deterministic Date and Math.random).",',
  '        ));',
  '      }',
  '      if (recorded.status === "done") return Promise.resolve(recorded.data);',
  '      if (recorded.status === "error") {',
  '        return Promise.reject(new Error("erxes.call(\\"" + toolId + "\\") failed: " + recorded.error));',
  '      }',
  '      return Promise.reject(new Error("erxes.call(\\"" + toolId + "\\") was interrupted."));',
  '    }',
  '    calls.push({ index, toolId, input: input === undefined ? null : input, status: "pending" });',
  '    throw new CodeModeSuspend("suspended");',
  '  },',
  '});',
  '',
  'const emit = (message) => {',
  '  process.stdout.write(PROTOCOL_PREFIX + JSON.stringify(message) + "\\n");',
  '};',
  'const jsonSafe = (value) => {',
  '  if (value === undefined) return null;',
  '  try { return JSON.parse(JSON.stringify(value)); } catch { return String(value); }',
  '};',
  'const fail = (error) => ({',
  '  type: "done",',
  '  result: null,',
  '  logs,',
  '  error: error && error.message ? String(error.message) : String(error),',
  '});',
  '',
  '(async () => {',
  '  const source = fs.readFileSync(CODE_PATH, "utf8");',
  '  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;',
  '  let fn;',
  '  try {',
  '    fn = new AsyncFunction("erxes", "console", "Date", "Math", "return (\\n" + source + "\\n)");',
  '  } catch {',
  '    fn = new AsyncFunction("erxes", "console", "Date", "Math", source);',
  '  }',
  '  let result;',
  '  try {',
  '    result = await fn(erxes, sandboxConsole, ReplayDate, replayMath);',
  '  } catch (error) {',
  '    if (error instanceof CodeModeSuspend) {',
  '      emit({ type: "need", calls: calls.filter((call) => call.status === "pending") });',
  '      return;',
  '    }',
  '    emit(fail(error));',
  '    return;',
  '  }',
  '  emit({ type: "done", result: jsonSafe(result), logs });',
  '})().catch((error) => {',
  '  emit(fail(error));',
  '});',
  '',
].join('\n');

const parseProtocol = (stdout: string): Record<string, unknown> | null => {
  const lines = stdout.split('\n');
  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index].trim();
    if (!line.startsWith(PROTOCOL_PREFIX)) continue;
    try {
      return JSON.parse(line.slice(PROTOCOL_PREFIX.length)) as Record<
        string,
        unknown
      >;
    } catch {
      return null;
    }
  }
  return null;
};

const asRequests = (value: unknown): ShimRequest[] => {
  if (!Array.isArray(value)) return [];
  const requests: ShimRequest[] = [];
  for (const entry of value) {
    if (
      entry &&
      typeof entry === 'object' &&
      typeof (entry as { index?: unknown }).index === 'number' &&
      typeof (entry as { toolId?: unknown }).toolId === 'string'
    ) {
      const request = entry as { index: number; toolId: string; input?: unknown };
      requests.push({
        index: request.index,
        toolId: request.toolId,
        input: request.input,
      });
    }
  }
  return requests;
};

/** Execute one requested capability on the host and record its outcome. */
const answerBridgeCall = async (
  auth: CodeExecutionAuth,
  registry: NativeToolRegistry,
  record: BridgeCallRecord,
  models: IModels,
): Promise<void> => {
  try {
    const descriptor = registry.tools.get(record.toolId);
    const data = await executeCodeModeCall({
      auth,
      toolId: record.toolId,
      input:
        record.input && typeof record.input === 'object'
          ? (record.input as Record<string, unknown>)
          : undefined,
      isMutation: descriptor?.method === 'mutation',
      models,
    });
    const serialized = JSON.stringify(data === undefined ? null : data);
    if (Buffer.byteLength(serialized) > MAX_BRIDGE_RESULT_BYTES) {
      record.status = 'error';
      record.error =
        'erxes.call result is too large for code mode (max 256KB per call). Narrow the query.';
      return;
    }
    record.status = 'done';
    record.data = JSON.parse(serialized) as unknown;
  } catch (error) {
    record.status = 'error';
    record.error = error instanceof Error ? error.message : String(error);
  }
};

const runnerFailure = (stderr: string, stdout: string): CodeExecutionResult => {
  const detail = (stderr || stdout).trim().slice(0, 2000);
  return {
    result: null,
    logs: [],
    error: detail
      ? `Sandboxed code runner failed: ${detail}`
      : 'Sandboxed code runner produced no result.',
  };
};

/**
 * Run code mode inside the OpenSandbox container. The installed SDK (0.1.11)
 * streams stdout server→client only — there is no stdin channel — so the
 * erxes bridge is mediated by deterministic memoized replay over the exported
 * command-service primitives, keeping the zero-egress invariant intact.
 */
export const runCodeIsolated = async ({
  models,
  settings,
  identity,
  auth,
  code,
  timeoutSeconds,
}: IsolatedCodeInput): Promise<CodeExecutionResult> => {
  // Fail fast through the existing config path before touching the workspace.
  resolveOpenSandboxRuntimeConfig(settings);

  const registry = await getNativeToolRegistry(auth.subdomain, { models });
  const state: BridgeState = {
    tools: registry.list.map((descriptor) => ({
      id: descriptor.id,
      kind: descriptor.kind,
      plugin: descriptor.plugin,
      module: descriptor.module,
      method: descriptor.method,
      description: descriptor.description,
    })),
    calls: [],
    timeBase: Date.now(),
  };

  await writeSandboxWorkspaceFiles(models, identity, {
    files: [
      { path: `${CODE_MODE_DIR}/runner.cjs`, content: SHIM_SOURCE },
      { path: `${CODE_MODE_DIR}/code.js`, content: code },
      { path: `${CODE_MODE_DIR}/state.json`, content: JSON.stringify(state) },
    ],
  });

  const deadline =
    Date.now() + (timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS) * 1000;

  for (;;) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      throw new ExpectedError('Code execution timed out');
    }
    const round = await runSandboxCommand(models, identity, {
      command: `node ${CODE_MODE_DIR}/runner.cjs`,
      timeoutSeconds: Math.max(1, Math.min(120, Math.ceil(remainingMs / 1000))),
    });

    const message = parseProtocol(round.stdout);
    if (!message) return runnerFailure(round.stderr, round.stdout);

    if (message.type === 'done') {
      return {
        result: message.result ?? null,
        logs: Array.isArray(message.logs)
          ? message.logs.filter(
              (line): line is string => typeof line === 'string',
            )
          : [],
        error:
          typeof message.error === 'string' && message.error
            ? message.error
            : undefined,
      };
    }

    if (message.type !== 'need') {
      return runnerFailure(round.stderr, round.stdout);
    }

    const requests = asRequests(message.calls);
    if (state.calls.length + requests.length > MAX_BRIDGE_CALLS) {
      return {
        result: null,
        logs: [],
        error: `Code mode allows at most ${MAX_BRIDGE_CALLS} erxes.call invocations per execution.`,
      };
    }

    for (const request of requests) {
      if (request.index !== state.calls.length) {
        return {
          result: null,
          logs: [],
          error:
            'Sandboxed code runner reported an unexpected call sequence. Keep erxes.call invocations sequential.',
        };
      }
      const record: BridgeCallRecord = {
        index: request.index,
        toolId: request.toolId,
        input: request.input ?? null,
        status: 'pending',
      };
      state.calls.push(record);
      await answerBridgeCall(auth, registry, record, models);
    }

    if (deadline - Date.now() <= 0) {
      throw new ExpectedError('Code execution timed out');
    }
    await writeSandboxWorkspaceFiles(models, identity, {
      files: [
        { path: `${CODE_MODE_DIR}/state.json`, content: JSON.stringify(state) },
      ],
    });
  }
};
