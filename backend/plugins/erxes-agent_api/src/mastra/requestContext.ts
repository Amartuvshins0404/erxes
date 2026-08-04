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
  /** Acting principal used by permission-sensitive caches and entity lookup. */
  principalUserId?: string;
  /** Human who initiated an interactive turn; absent for background events. */
  initiatorUserId?: string;
  /** Current thread, used for skills and generated artifacts. */
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
  /** True for unattended workflow execution authenticated as the agent's linked
   *  core account. Destructive operations then require impossible live approval
   *  and remain blocked. */
  background?: boolean;
  /** Workspace runtime gate for the memory-heavy image background tool. */
  backgroundRemovalEnabled?: boolean;
}

const authStorage = new AsyncLocalStorage<RequestAuth>();

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
