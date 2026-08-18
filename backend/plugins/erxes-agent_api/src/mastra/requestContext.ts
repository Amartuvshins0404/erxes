import { AsyncLocalStorage } from 'async_hooks';

// Propagates auth headers through the entire async call chain.
// Any tool executed within runWithAuth() automatically inherits the context.

/** A destructive operation the user approved for this turn (op name + its args). */
export interface ApprovedOp {
  operation: string;
  args?: Record<string, unknown>;
}

interface RequestAuth {
  /** Base64-encoded acting user for trusted internal subgraph calls. */
  userHeader?: string;
  /** Acting principal used by permission-sensitive caches and execution. */
  principalUserId?: string;
  /** Human who initiated the turn. */
  initiatorUserId?: string;
  /** Current thread, used for generated artifacts. */
  threadId?: string;
  agentId?: string;
  /** Tenant of the request — required by tools that query tenant-partitioned stores. */
  subdomain?: string;
  /** Core API base URL configured for file operations in this turn. */
  erxesApiUrl?: string;
  /** Once direct private storage fails, reuse core as this turn's storage authority. */
  preferCoreFileUpload?: boolean;
  /** Unique id for THIS turn — artifacts created in the turn share it, so they
   *  can be grouped per chat instance and linked to the assistant message. */
  turnId?: string;
  /** When THIS turn started — guards the assistant-id recovery in persistTurn
   *  against recalling a PREVIOUS turn's assistant row (a mislink that detaches
   *  the turn's artifacts from their real message). */
  turnStartedAt?: Date;
  /** The user's message that drove this turn — the Files-list group header. */
  turnPrompt?: string;
  /** Successfully persisted artifacts produced during this turn. */
  artifactCount?: number;
  /** Persisted website artifacts produced during this turn. */
  websiteArtifactCount?: number;
  /** Owner (scoped) resource id — stamped on artifacts for ownership scoping. */
  resourceId?: string;
  /** Destructive ops the user approved for THIS turn — the execute guard runs an
   *  otherwise-gated delete/merge only when it matches one of these. */
  approvedOps?: ApprovedOp[];
  /** Workspace runtime gate for the memory-heavy image background tool. */
  backgroundRemovalEnabled?: boolean;
  /** Per-turn exact-call cache. Repeated model calls share the first promise,
   *  including failures, so one broken dependency cannot create a retry storm. */
  toolCallCache?: Map<string, Promise<unknown>>;
  /** Number of tool invocations admitted during this turn. */
  toolCallCount?: number;
  /** Hard stop for tool invocations; defaults to fifty. */
  toolCallLimit?: number;
  /** Serial tail for state-changing tools while reads run concurrently. */
  mutationTail?: Promise<void>;
}

const authStorage = new AsyncLocalStorage<RequestAuth>();
function canonicalToolArgs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalToolArgs);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalToolArgs(item)]),
  );
}

/** Stable identity shared by execution deduplication and loop protection. */
export function exactToolCallKey(toolName: string, args: unknown): string {
  return `${toolName}:${JSON.stringify(canonicalToolArgs(args))}`;
}

/** Run fn with the given auth visible to every async callee (tools, fetches). */
export function runWithAuth<T>(
  ctx: RequestAuth,
  fn: () => Promise<T>,
): Promise<T> {
  return authStorage.run(ctx, fn);
}

/** The auth context of the current async chain, when inside runWithAuth. */
export function getCurrentAuth(): RequestAuth | undefined {
  return authStorage.getStore();
}

/**
 * Execute an exact tool call at most once in the active turn. Concurrent
 * duplicates share the same promise; rejected calls remain cached for the turn
 * so a non-repairable failure cannot consume the provider/tool quota repeatedly.
 */
export async function runToolOnce<T>(
  toolName: string,
  args: unknown,
  execute: () => Promise<T>,
): Promise<T> {
  const auth = authStorage.getStore();
  if (!auth?.turnId) return execute();

  const key = exactToolCallKey(toolName, args);
  auth.toolCallCache ??= new Map<string, Promise<unknown>>();

  // Every invocation — first or exact repeat — spends from the same budget,
  // so a stuck model repeating one cached call still hits the hard stop
  // instead of looping forever at zero cost.
  const limit = auth.toolCallLimit ?? 50;
  const count = auth.toolCallCount ?? 0;
  if (count >= limit) {
    throw new Error(
      `This turn reached its ${limit}-tool execution limit. Summarize the results already available.`,
    );
  }
  auth.toolCallCount = count + 1;

  const existing = auth.toolCallCache.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const pending = Promise.resolve().then(execute);
  auth.toolCallCache.set(key, pending);
  return pending;
}

type ToolExecute = (
  input: unknown,
  context?: unknown,
) => unknown | Promise<unknown>;

function hasToolExecute(tool: object): tool is object & {
  execute: ToolExecute;
} {
  return 'execute' in tool && typeof tool.execute === 'function';
}

export interface ToolExecutionControlOptions {
  /** Queue this tool behind other side-effecting calls in the same turn. */
  serial?: boolean;
}

/**
 * Apply the turn-wide exact-call cache and execution budget to a Mastra tool.
 * The wrapper keeps the original tool metadata/schema and only intercepts its
 * execute function.
 */
export function withToolExecutionControl<T extends object>(
  toolName: string,
  tool: T,
  options: ToolExecutionControlOptions = {},
): T {
  if (!hasToolExecute(tool)) return tool;
  const execute = tool.execute;
  return {
    ...tool,
    execute: (input: unknown, context?: unknown) =>
      runToolOnce(toolName, input, () => {
        if (options.serial) {
          return runMutationSerially(() =>
            Promise.resolve(execute.call(tool, input, context)),
          );
        }
        return Promise.resolve(execute.call(tool, input, context));
      }),
  };
}

/**
 * Keep state-changing calls ordered while independent reads run concurrently.
 * A failed call releases the queue and does not block later work.
 */
export async function runMutationSerially<T>(
  execute: () => Promise<T>,
): Promise<T> {
  const auth = authStorage.getStore();
  if (!auth?.turnId) return execute();

  const previous = auth.mutationTail ?? Promise.resolve();
  let release!: () => void;
  auth.mutationTail = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous.catch(() => undefined);
  try {
    return await execute();
  } finally {
    release();
  }
}

/** Track persisted artifacts on the active turn without another database read. */
export function recordStoredArtifacts(count: number): void {
  const auth = authStorage.getStore();
  if (!auth || count < 1) return;
  auth.artifactCount = (auth.artifactCount ?? 0) + count;
}

/** Track website delivery separately from other generated files. */
export function recordStoredWebsiteArtifacts(count: number): void {
  const auth = authStorage.getStore();
  if (!auth || count < 1) return;
  auth.websiteArtifactCount = (auth.websiteArtifactCount ?? 0) + count;
}
