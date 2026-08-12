// ---------------------------------------------------------------------------
// Native chat store — read/translate layer over Mastra's native memory store.
//
// The chat UI's GraphQL/SSE contract (MastraThread / MastraMessage) is served
// straight from Mastra-native threads/messages (erxes_mastra_memory) — there is
// no bespoke mongoose store. Tenant + ownership isolation is by resourceId
// (scopedResource(subdomain, userId)); the erxes↔agent binding and the rich
// per-turn artifacts live in thread.metadata.agentId and the namespaced
// message content.metadata.erxes blob (written by persistTurn's patch).
// ---------------------------------------------------------------------------
import { ExpectedError } from 'erxes-api-shared/utils';
import {
  getMastraMemory,
  getMastraStore,
  scopedResource,
} from '~/mastra/memory/mastraMemory';
import { clampPage } from '@/_shared/auth';
import { findMessagePairIds } from '@/session/messagePair';
import { sanitizePersistedProviderOutput } from '~/mastra/providerOutputGuard';

// ── Minimal native shapes we read (Mastra's own types are wider). ───────────
interface NativeThread {
  id: string;
  title?: string;
  resourceId: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
}
interface NativeMessage {
  id: string;
  role: string;
  threadId?: string;
  createdAt?: Date;
  content?: {
    content?: string;
    parts?: unknown[];
    metadata?: { erxes?: Record<string, unknown> };
  } & Record<string, unknown>;
}

// ── Typed facade over Mastra's native memory/store ──────────────────────────
// Mastra's published Memory/store generics are wider than (and shaped
// differently from) the read/write slice this layer drives, so every call site
// used to launder its args through `as never`. Declare the exact surface once
// here and cast at the single facade boundary (getNativeMemory) — the call
// sites stay fully typed.
interface NativeMemoryFacade {
  recall(args: {
    threadId: string;
    resourceId: string;
    perPage: number | false;
    page: number;
    orderBy?: { field: string; direction: 'ASC' | 'DESC' };
  }): Promise<{ messages?: NativeMessage[]; total?: number }>;
  getThreadById(args: {
    threadId: string;
    resourceId?: string;
  }): Promise<NativeThread | null>;
  listThreads(args: {
    filter?: { resourceId?: string; metadata?: Record<string, unknown> };
    orderBy?: { field: string; direction: 'ASC' | 'DESC' };
    perPage?: number | false;
    // Zero-indexed page for offset pagination (defaults to 0 in the store).
    page?: number;
  }): Promise<{ threads?: NativeThread[]; total?: number }>;
  createThread(args: {
    threadId: string;
    resourceId: string;
    title: string;
    metadata?: Record<string, unknown>;
  }): Promise<NativeThread>;
  // Mastra Message v2 write — used to create an assistant row when the model
  // run finished in error/abort and native persistence was skipped entirely.
  saveMessages(args: {
    messages: {
      id: string;
      role: string;
      threadId: string;
      resourceId: string;
      createdAt: Date;
      content: Record<string, unknown>;
      type?: string;
    }[];
  }): Promise<unknown>;
  updateThread(args: {
    id: string;
    title: string;
    metadata?: Record<string, unknown>;
  }): Promise<NativeThread>;
  deleteMessages(messageIds: string[]): Promise<void>;
  deleteThread(threadId: string): Promise<unknown>;
}

// Storage-domain message updates that Memory itself does not surface. Reached
// through getMastraStore().stores.memory.
interface NativeStoreFacade {
  // Storage-domain message write — patches content as a plain Mongo update.
  // Deliberately NOT Memory.updateMessages so a metadata-only patch touches only
  // the message document. See patchNativeMessages.
  updateMessages(args: {
    messages: { id: string; content: Record<string, unknown> }[];
  }): Promise<unknown>;
}

/** The shared Mastra Memory, typed to the slice this layer uses. Single cast
 *  boundary — call sites get the facade, never the raw `as never` calls. */
export async function getNativeMemory(
  subdomain: string,
): Promise<NativeMemoryFacade> {
  return (await getMastraMemory(subdomain)) as unknown as NativeMemoryFacade;
}

/** The native store's message write surface. */
async function getNativeStore(subdomain: string): Promise<NativeStoreFacade> {
  const store = await getMastraStore(subdomain);
  return (store as unknown as { stores: { memory: NativeStoreFacade } }).stores
    .memory;
}

/**
 * Patch persisted message content (for example attachments, interrupted state,
 * or guarded reply text) via the STORAGE domain, bypassing
 * Memory.updateMessages on purpose.
 *
 * Memory.updateMessages carries extra write semantics that can throw and abandon
 * the turn-end patch — which can also null the assistant id that inline artifact
 * cards link to. The store write is a plain Mongo update of the message
 * document. Best-effort — a write failure is logged, never thrown, so it can't
 * abort the rest of the turn-end work.
 */
export async function patchNativeMessages(
  subdomain: string,
  patches: { id: string; content: Record<string, unknown> }[],
): Promise<void> {
  if (!patches.length) return;
  try {
    const store = await getNativeStore(subdomain);
    await store.updateMessages({ messages: patches });
  } catch (e) {
    console.warn(
      `[native-chat-store] message meta patch skipped: ${
        (e as Error)?.message || e
      }`,
    );
  }
}

/**
 * Create an assistant message row directly.
 *
 * Mastra persists a turn's messages only on a successful finish — error and
 * abort finishes write nothing, which used to leave failed turns as a bare
 * user question with no answer at all. When finalization still produced a
 * user-facing reply (an interruption/failure line), this inserts the row the
 * native save skipped. Best-effort like patchNativeMessages: a write failure
 * is logged, never thrown. Returns the new message id (or null on failure).
 */
export async function createNativeAssistantMessage(params: {
  subdomain: string;
  threadId: string;
  resourceId: string;
  reply: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const { subdomain, threadId, resourceId, reply, metadata } = params;
  try {
    const memory = await getNativeMemory(subdomain);
    const id = `erxes-finalized-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
    await memory.saveMessages({
      messages: [
        {
          id,
          role: 'assistant',
          threadId,
          resourceId,
          createdAt: new Date(),
          content: {
            format: 2,
            parts: [{ type: 'text', text: reply }],
            content: reply,
            ...(metadata ? { metadata: { erxes: metadata } } : {}),
          },
        },
      ],
    });
    return id;
  } catch (e) {
    console.warn(
      `[native-chat-store] assistant row create skipped: ${
        (e as Error)?.message || e
      }`,
    );
    return null;
  }
}

/**
 * Update a thread while preserving the bits a blind updateThread would clobber.
 * Mastra's updateThread requires a title and replaces metadata wholesale, so
 * every caller has to re-supply the current title and spread the existing
 * metadata before layering its patch. This centralises that dance: pass the
 * thread you read and the metadata keys to set; the title and untouched
 * metadata carry through. Deterministic titles and manual renames therefore
 * remain unchanged while metadata is reconciled.
 */
async function preserveTitleUpdate(
  memory: NativeMemoryFacade,
  thread: Pick<NativeThread, 'id' | 'title' | 'metadata'> & { id?: string },
  threadId: string,
  metaPatch: Record<string, unknown>,
): Promise<NativeThread> {
  return memory.updateThread({
    id: threadId,
    title: thread.title ?? '',
    metadata: { ...(thread.metadata ?? {}), ...metaPatch },
  });
}

// ── The GraphQL shapes (mirror session/graphql/schemas/session.ts). ─────────
export interface ErxesThread {
  _id: string;
  threadId: string;
  agentId: string | null;
  title: string;
  lastMessageAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** A page of a user's threads + the total for the filter (drives "load more"). */
export interface ErxesThreadPage {
  list: ErxesThread[];
  totalCount: number;
}
export interface ErxesMessage {
  _id: string;
  threadId: string | null;
  role: string;
  content: string;
  // Mastra's native text and tool parts. Tool output drives approvals,
  // artifacts, and error display after a reload.
  parts: unknown[] | null;
  meta: Record<string, unknown> | null;
  attachments: unknown;
  createdAt: Date | null;
}

/** Translate a native thread to the UI's MastraThread shape, surfacing agentId
 *  from metadata. The session list shows only the title, so no message count is
 *  derived here — see listOwnedThreads. */
function toErxesThread(t: NativeThread): ErxesThread {
  const meta = (t.metadata ?? {}) as { agentId?: string };
  return {
    _id: t.id,
    threadId: t.id,
    agentId: meta.agentId ?? null,
    title: t.title ?? '',
    lastMessageAt: t.updatedAt ?? t.createdAt ?? null,
    createdAt: t.createdAt ?? null,
    updatedAt: t.updatedAt ?? null,
  };
}

function toErxesMessage(m: NativeMessage): ErxesMessage {
  // Split attachments from plugin metadata and omit old trace-only fields.
  const erxes = {
    ...((m.content?.metadata?.erxes ?? {}) as Record<string, unknown>),
  };
  const attachments = erxes.attachments ?? null;
  delete erxes.attachments;
  delete erxes.thinking;
  delete erxes.reasoningSummaries;
  delete erxes.turnSummary;
  delete erxes.langfuseTraceId;
  delete erxes.learningIdsInContext;
  delete erxes.activeSkills;
  const content =
    typeof m.content?.content === 'string' ? m.content.content : '';
  const parts = Array.isArray(m.content?.parts) ? m.content.parts : [];
  const safe =
    m.role === 'assistant'
      ? sanitizePersistedProviderOutput(content, parts)
      : { content, parts };
  const userFacingParts = safe.parts.filter(
    (part) =>
      !part ||
      typeof part !== 'object' ||
      (part as { type?: unknown }).type !== 'reasoning',
  );
  return {
    _id: m.id,
    threadId: m.threadId ?? null,
    role: m.role,
    content: safe.content,
    parts: userFacingParts.length ? userFacingParts : null,
    meta: Object.keys(erxes).length ? erxes : null,
    attachments,
    createdAt: m.createdAt ?? null,
  };
}

// Default/max page sizes for the session sidebar. The list is loaded a page at a
// time (newest first) so its cost stays O(perPage) no matter how many sessions a
// user accumulates — it never fetches the whole history up front.
const THREADS_DEFAULT_PER_PAGE = 30;
const THREADS_MAX_PER_PAGE = 100;

/**
 * One page of a user's own threads for an agent (newest first), in the UI shape.
 *
 * This is a single indexed store read — it deliberately does NOT derive a
 * per-thread message count. The sidebar renders only the title, and counting
 * messages meant one extra recall per thread (an N+1 that grew linearly with the
 * session count and dominated the list's load time). Pagination + dropping that
 * count keep this O(perPage).
 *
 * `page` is 1-indexed at this boundary (GraphQL convention) and mapped to the
 * store's 0-indexed page.
 */
export async function listOwnedThreads(
  subdomain: string,
  userId: string,
  agentId: string,
  page = 1,
  perPage = THREADS_DEFAULT_PER_PAGE,
): Promise<ErxesThreadPage> {
  const memory = await getNativeMemory(subdomain);
  const resourceId = scopedResource(subdomain, userId);
  const { page: safePage, perPage: safePerPage } = clampPage(page, perPage, {
    def: THREADS_DEFAULT_PER_PAGE,
    max: THREADS_MAX_PER_PAGE,
  });
  const res = await memory.listThreads({
    filter: { resourceId, metadata: { agentId } },
    orderBy: { field: 'updatedAt', direction: 'DESC' },
    perPage: safePerPage,
    page: safePage - 1,
  });
  return {
    list: (res?.threads ?? []).map(toErxesThread),
    totalCount: res?.total ?? 0,
  };
}

/**
 * Whether a resource already owns at least one persisted thread. Used to decide
 * if semantic recall is worth running on a turn whose own thread is brand new:
 * under resource-scoped recall (the default) a new thread can still recall from
 * the user's OTHER threads, so only a resource with no prior thread has nothing
 * to recall. The current turn registers its thread AFTER this check, so it never
 * counts itself. One bounded (perPage:1) existence read — no per-thread counts.
 */
export async function resourceHasThreads(
  subdomain: string,
  resourceId: string,
): Promise<boolean> {
  const memory = await getNativeMemory(subdomain);
  const res = await memory.listThreads({
    filter: { resourceId },
    perPage: 1,
  });
  return Boolean(res?.threads?.length);
}

/**
 * Register a chat thread in the native store and stamp its erxes↔agent binding
 * (metadata.agentId + tenant) BEFORE the turn streams — so the session is
 * immediately listable (listOwnedThreads filters on metadata.agentId) and
 * survives a reload that happens WHILE the agent is still running.
 *
 * Without this the thread is created and tagged only at step/turn boundaries:
 * Mastra persists natively per completed generation step (savePerStep), and
 * the agentId tag is written by patchNativeTurn after the stream loop. So
 * refreshing mid-run — which also aborts the SSE run — could leave no
 * agentId-tagged thread for the sidebar query to find, and the in-flight
 * session vanished.
 *
 * Idempotent: creates the thread when absent, back-fills the binding when an
 * existing thread is missing/stale on it, and no-ops otherwise. The caller gates
 * on a memory binding (workspace memory + known tenant) and treats it as
 * best-effort — a store hiccup here must never block the turn.
 */
export async function ensureThreadRegistered(
  subdomain: string,
  threadId: string,
  resourceId: string,
  agentId: string,
  initialTitle?: string | null,
): Promise<void> {
  const memory = await getNativeMemory(subdomain);
  const existing = await memory.getThreadById({ threadId, resourceId });
  const title = initialTitle?.trim() ?? '';

  if (!existing) {
    await memory.createThread({
      threadId,
      resourceId,
      title,
      metadata: {
        agentId,
        subdomain,
        ...(title ? { titleSource: 'derived' } : {}),
      },
    });
    return;
  }

  const meta = (existing.metadata ?? {}) as {
    agentId?: string;
    subdomain?: string;
    titleSource?: string;
  };
  const needsBinding = meta.agentId !== agentId || meta.subdomain !== subdomain;
  const needsTitle =
    !existing.title && Boolean(title) && meta.titleSource !== 'manual';
  if (!needsBinding && !needsTitle) return;

  await memory.updateThread({
    id: threadId,
    title: needsTitle ? title : existing.title ?? '',
    metadata: {
      ...meta,
      agentId,
      subdomain,
      ...(needsTitle ? { titleSource: 'derived' } : {}),
    },
  });
}

/**
 * Rewrite legacy agent identifiers in native thread metadata after the account
 * becomes canonical. Resource ownership and messages stay untouched.
 */
export async function migrateNativeAgentIds(
  subdomain: string,
  aliases: ReadonlyMap<string, string>,
): Promise<number> {
  if (!aliases.size) return 0;
  const memory = await getNativeMemory(subdomain);
  const perPage = 100;
  let page = 0;
  let changed = 0;
  while (true) {
    const result = await memory.listThreads({
      filter: { metadata: { subdomain } },
      orderBy: { field: 'createdAt', direction: 'ASC' },
      perPage,
      page,
    });
    const threads = result?.threads ?? [];
    for (const thread of threads) {
      const metadata = (thread.metadata ?? {}) as { agentId?: string };
      const agentId = metadata.agentId
        ? aliases.get(metadata.agentId)
        : undefined;
      if (!agentId || agentId === metadata.agentId) continue;
      await preserveTitleUpdate(memory, thread, thread.id, { agentId });
      changed += 1;
    }
    if (threads.length < perPage) break;
    page += 1;
  }
  return changed;
}

/** Ownership-checked transcript for one thread (chronological), UI shape. */
/** Throw "Thread not found" unless `userId` owns `threadId` (resourceId scope).
 *  Reused by reads that live outside the native store (e.g. the artifact list). */
export async function assertThreadOwned(
  subdomain: string,
  userId: string,
  threadId: string,
): Promise<void> {
  const memory = await getNativeMemory(subdomain);
  const resourceId = scopedResource(subdomain, userId);
  const thread = await memory.getThreadById({ threadId, resourceId });
  if (!thread) throw new ExpectedError('Thread not found');
}

export async function getOwnedThreadMessages(
  subdomain: string,
  userId: string,
  threadId: string,
): Promise<ErxesMessage[]> {
  const memory = await getNativeMemory(subdomain);
  const resourceId = scopedResource(subdomain, userId);
  // Ownership: getThreadById filters by resourceId, so another user's thread
  // (or a bot thread) reads back as null — reported as "not found", no leak.
  const thread = await memory.getThreadById({ threadId, resourceId });
  if (!thread) throw new ExpectedError('Thread not found');
  const res = await memory.recall({
    threadId,
    resourceId,
    perPage: false,
    page: 0,
    orderBy: { field: 'createdAt', direction: 'ASC' },
  });
  return (res?.messages ?? []).map(toErxesMessage);
}

/** Rename a thread the caller owns. Records titleSource='manual' so later
 * deterministic registration never overwrites the user's title. */
export async function renameOwnedThread(
  subdomain: string,
  userId: string,
  threadId: string,
  title: string,
): Promise<ErxesThread> {
  const memory = await getNativeMemory(subdomain);
  const resourceId = scopedResource(subdomain, userId);
  const thread = await memory.getThreadById({ threadId, resourceId });
  if (!thread) throw new ExpectedError('Thread not found');
  const updated = await memory.updateThread({
    id: threadId,
    title,
    metadata: { ...(thread.metadata ?? {}), titleSource: 'manual' },
  });
  return toErxesThread(updated);
}

export interface RemovedMessagePair {
  deletedIds: string[];
  remainingCount: number;
}

/** Delete one owned user prompt and its following assistant reply. */
export async function removeOwnedMessagePair(
  subdomain: string,
  userId: string,
  threadId: string,
  messageId: string,
): Promise<RemovedMessagePair> {
  const memory = await getNativeMemory(subdomain);
  const resourceId = scopedResource(subdomain, userId);
  const thread = await memory.getThreadById({ threadId, resourceId });
  if (!thread) throw new ExpectedError('Thread not found');

  const recalled = await memory.recall({
    threadId,
    resourceId,
    perPage: false,
    page: 0,
    orderBy: { field: 'createdAt', direction: 'ASC' },
  });
  const messages = (recalled?.messages ?? []).map(toErxesMessage);
  const deletedIds = findMessagePairIds(messages, messageId);
  if (!deletedIds) throw new ExpectedError('Message not found');
  await memory.deleteMessages(deletedIds);

  return {
    deletedIds,
    remainingCount: Math.max(0, messages.length - deletedIds.length),
  };
}

/** Delete a thread the caller owns (and its messages + vectors). */
export async function removeOwnedThread(
  subdomain: string,
  userId: string,
  threadId: string,
): Promise<{ ok: number }> {
  const memory = await getNativeMemory(subdomain);
  const resourceId = scopedResource(subdomain, userId);
  const thread = await memory.getThreadById({ threadId, resourceId });
  if (!thread) throw new ExpectedError('Thread not found');
  await memory.deleteThread(threadId);
  return { ok: 1 };
}

/** Current native title for a thread (for the SSE thread_title push). */
export async function getThreadTitle(
  subdomain: string,
  threadId: string,
  resourceId: string,
): Promise<string | null> {
  const memory = await getNativeMemory(subdomain);
  const thread = await memory.getThreadById({ threadId, resourceId });
  return thread?.title || null;
}
