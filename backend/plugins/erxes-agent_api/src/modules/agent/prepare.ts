import { randomUUID } from 'node:crypto';
import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { isAgentAdmin, canUserAccessAgent, getUserUnitIds } from '@/agent/utils';
import { IModels } from '~/connectionResolvers';
import { getOrCreateAgent } from '~/mastra/agentRuntime';
import {
  isAdvancedMemoryEnabled,
  resolveRecallTuning,
} from '~/mastra/memory/config';
import { scopedResource } from '~/mastra/memory/mastraMemory';
import { deriveResourceId, augmentConvo, MemoryContext } from '~/mastra/memory';
import { readLearnedDigest } from '~/mastra/learning/digest';
import { ApprovedOp } from '~/mastra/requestContext';
import { buildChatUserContent } from '~/mastra/files/chatContent';
import { IMastraChatAttachment } from '@/session/@types/session';
import {
  ensureThreadRegistered,
  getNativeMemory,
  resourceHasThreads,
} from '@/session/nativeStore';
import { buildActivatedSkillsBlock } from '@/skills/service/skillsService';
import { IMastraAgentDocument } from '@/agent/@types/agent';
import { IMastraProviderDocument } from '@/provider/@types/provider';
import { IMastraSettingsDocument } from '@/settings/@types/settings';
import {
  MemoryBinding,
  PreparedTurn,
  TurnAgent,
  TurnIdentity,
  TurnMessage,
} from '@/agent/types';

// Turn setup: everything a chat turn needs before the model runs — agent +
// tools, thread ownership check, replayed history, advanced-memory blocks, and
// the auth context tools execute under. One spine shared by all four callers
// (in-app chat, the GraphQL resolver, the frontline bot webhook, scheduled
// runs); `identity` (see TurnIdentity) is the single knob that varies — it
// decides resource scoping, auth, ownership gating, and the memory toggle.
// Throws user-facing errors on bad agent/thread.

// Per-identity resource id, the memory toggle, and the auth context. Pure
// (no I/O) so the spine reads as straight-line logic.
function resolveIdentity(
  identity: TurnIdentity,
  agentId: string,
  advanced: boolean,
  message: string,
): {
  resourceId: string;
  useMemory: boolean;
  userHeader?: string;
  token?: string;
} {
  switch (identity.kind) {
    case 'user':
      return {
        resourceId: deriveResourceId({ user: identity.user, agentId }),
        // Advanced memory rides on the agent's own history toggle.
        useMemory: advanced,
        userHeader: identity.user
          ? Buffer.from(JSON.stringify(identity.user)).toString('base64')
          : undefined,
        // Forward the logged-in user's login token outbound (as a Bearer) so
        // gateway calls run under THEIR permissions — not the app token. The
        // decoded user carries loginToken even though IUserDocument omits it.
        token: (identity.user as { loginToken?: string } | undefined)
          ?.loginToken,
      };
    case 'bot':
      return {
        resourceId: identity.resourceKey,
        // The bot only persists/recalls when there is a real user message.
        useMemory: advanced && Boolean(message.trim()),
      };
    case 'schedule':
      return {
        resourceId: identity.resourceKey,
        useMemory: advanced,
      };
  }
}

// Same NoSQL-injection guard used for sessionId below: agentId arrives from the
// request body, so a crafted object must never reach a Mongo query.
function assertAgentId(agentId: string): void {
  if (typeof agentId !== 'string' || !agentId) {
    throw new ExpectedError('agentId must be a non-empty string');
  }
}

// Stable session id — the persisted thread this turn belongs to. The typeof
// guard keeps crafted non-string payloads out of Mongo queries (NoSQL injection
// via query operators).
function deriveSessionId(threadId?: string): string {
  return typeof threadId === 'string' && threadId
    ? threadId
    : `chat-${Date.now()}`;
}

interface TurnConfig {
  agentConfig: IMastraAgentDocument;
  settings: IMastraSettingsDocument;
  providers: IMastraProviderDocument[];
}

// The concurrent config/access reads plus the access-control gate. Four
// independent reads collapsed into one round trip. Unit membership lives on the
// unit document (not the user), so it needs its own query — issued in parallel
// with the other three so it adds no wall-clock latency. Non-user identities
// (bot, schedule) don't need unit membership.
async function readTurnConfig(
  models: IModels,
  identity: TurnIdentity,
  agentId: string,
): Promise<TurnConfig> {
  const [agentConfig, settings, providers, unitIds] = await Promise.all([
    models.MastraAgent.findOne({ agentId, isEnabled: true }),
    models.MastraSettings.getSettings(),
    models.MastraProvider.find({ isEnabled: true }),
    identity.kind === 'user' && identity.user
      ? getUserUnitIds(models, identity.user._id)
      : Promise.resolve<string[]>([]),
  ]);
  if (!agentConfig)
    throw new ExpectedError(`Agent "${agentId}" not found or disabled`);

  if (identity.kind === 'user' && identity.user) {
    if (
      !canUserAccessAgent(
        agentConfig,
        identity.user._id,
        isAgentAdmin(identity.user),
        identity.user.branchIds ?? [],
        identity.user.departmentIds ?? [],
        unitIds,
      )
    ) {
      throw new ExpectedError(`Agent "${agentId}" not found or disabled`);
    }
  }

  return { agentConfig, settings, providers };
}

interface TurnMemory {
  advanced: boolean;
  resourceId: string;
  useMemory: boolean;
  userHeader?: string;
  token?: string;
  memCtx: MemoryContext;
  memoryBinding?: MemoryBinding;
}

// Identity + memory-binding resolution: the memory toggle, per-identity resource
// id/auth, and the per-turn Mastra Memory binding.
function resolveTurnMemory(args: {
  identity: TurnIdentity;
  agentConfig: IMastraAgentDocument;
  agentId: string;
  message: string;
  subdomain: string;
  sessionId: string;
}): TurnMemory {
  const { identity, agentConfig, agentId, message, subdomain, sessionId } = args;

  const useHistory = agentConfig.memoryEnabled !== false;
  // Advanced memory rides on the agent's own memory toggle.
  const advanced = isAdvancedMemoryEnabled() && useHistory;

  const { resourceId, useMemory, userHeader, token } = resolveIdentity(
    identity,
    agentId,
    advanced,
    message,
  );

  const memCtx: MemoryContext = {
    subdomain,
    resourceId,
    threadId: sessionId,
    agentId,
  };

  // Mastra Memory (attached to the agent in getOrCreateAgent) is the ONLY chat
  // store: it persists the turn, replays recent history, and runs semantic
  // recall + working memory via the per-turn binding below. An unknown tenant
  // does NOT skip persistence — scopedResource defaults an empty subdomain to
  // the "os" scope so the thread is still persisted and listable.
  const memoryBinding: MemoryBinding | undefined = useMemory
    ? { thread: sessionId, resource: scopedResource(subdomain, resourceId) }
    : undefined;

  return {
    advanced,
    resourceId,
    useMemory,
    userHeader,
    token,
    memCtx,
    memoryBinding,
  };
}

// Build the agent, read the thread (ownership + thread-history), and — under
// resource-scoped recall — probe whether the resource owns any prior thread, all
// concurrently. None needs another's result, so they overlap instead of stacking
// round trips. The resource probe is issued speculatively (its result is only
// consulted when the thread itself turns out to be new); it rides alongside the
// ownership read, so it adds no wall-clock on the common path. Enforces the
// ownership gate and decides the scope-aware recall skip.
async function buildAgentAndGateMemory(args: {
  agentConfig: IMastraAgentDocument;
  models: IModels;
  subdomain: string;
  settings: IMastraSettingsDocument;
  providers: IMastraProviderDocument[];
  identity: TurnIdentity;
  threadId: string | undefined;
  sessionId: string;
  memoryBinding: MemoryBinding | undefined;
}) {
  const {
    agentConfig,
    models,
    subdomain,
    settings,
    providers,
    identity,
    threadId,
    sessionId,
    memoryBinding,
  } = args;

  // What the semantic recall is scoped to (env-driven, default 'resource'). This
  // decides what "nothing to recall" means for the first-turn skip below.
  const recallResource = memoryBinding?.resource;
  const recallScope = resolveRecallTuning().scope;

  const needsThreadRead = Boolean(
    identity.kind === 'user' &&
      memoryBinding &&
      typeof threadId === 'string' &&
      threadId,
  );
  const needsResourceProbe = Boolean(
    identity.kind === 'user' &&
      memoryBinding &&
      recallScope === 'resource' &&
      recallResource,
  );
  const [{ agent, tools }, priorThread, resourceHadThreads] = await Promise.all([
    getOrCreateAgent(agentConfig, models, subdomain, {
      settings,
      providers,
    }),
    needsThreadRead
      ? getNativeMemory(subdomain).then((m) =>
          m.getThreadById({ threadId: sessionId }),
        )
      : Promise.resolve(null),
    needsResourceProbe && recallResource
      ? // Best-effort: this is only a recall optimization, so a failure must degrade
        // to the safe default (null → "history might exist" → recall stays on), never
        // abort the turn via the Promise.all.
        resourceHasThreads(subdomain, recallResource).catch(() => null)
      : Promise.resolve<boolean | null>(null),
  ]);

  // Ownership gate: a CONTINUED thread must belong to this caller. getThreadById
  // without a resource returns the thread whatever its owner; if it exists under
  // a different resource it is someone else's session — reported as "not found"
  // (no existence leak). Only in-app users own threads; bot/schedule resources
  // are synthetic and self-scoped, so the gate is a no-op for them. (Building the
  // agent for a thread that fails this check is harmless — the agent is cached.)
  if (
    priorThread &&
    memoryBinding &&
    priorThread.resourceId !== memoryBinding.resource
  ) {
    throw new ExpectedError('Thread not found');
  }

  // Skip semantic recall only when it can return NOTHING — the embed + Qdrant
  // round trip inside agent.stream() is otherwise pure latency. "Nothing to
  // recall" is scope-aware (the critical correctness point):
  //   • thread scope  → recall sees only THIS thread, so skip when it is new
  //     (priorThread === null, i.e. owned thread does not exist yet).
  //   • resource scope → recall spans every thread of the resource, so a new
  //     thread can still recall from the user's other threads; only a resource
  //     with no prior thread (resourceHadThreads === false) has nothing.
  // A continued thread (priorThread present) always keeps recall on. Non-user
  // identities keep their existing always-recall behaviour. The skip is a
  // per-call deep-merge of semanticRecall:false, so working memory, recent
  // history, and native titling are untouched.
  const recallCanReturnHistory =
    identity.kind !== 'user' ||
    !memoryBinding ||
    !!priorThread ||
    (recallScope === 'resource' && resourceHadThreads !== false);
  const skipSemanticRecall = Boolean(memoryBinding && !recallCanReturnHistory);

  return { agent, tools, skipSemanticRecall };
}

// Register the thread + its agent binding NOW, before the model streams, so the
// session is listable the moment the turn starts — not only after it finishes.
// This is what lets a refresh WHILE the agent is still running keep the session:
// the sidebar query (listOwnedThreads → metadata.agentId) finds it, and reopening
// it hydrates the persisted turn. patchNativeTurn re-stamps the same binding at
// turn-end. In-app chat only (bot/schedule threads are not user-listable, and
// their binding stamp at turn-end suffices). Best-effort: never block the turn on
// a store hiccup (the end-of-turn stamp is the backstop).
async function preRegisterThread(args: {
  identity: TurnIdentity;
  memoryBinding: MemoryBinding | undefined;
  subdomain: string;
  sessionId: string;
  agentId: string;
}): Promise<void> {
  const { identity, memoryBinding, subdomain, sessionId, agentId } = args;
  if (identity.kind === 'user' && memoryBinding) {
    await ensureThreadRegistered(
      subdomain,
      sessionId,
      memoryBinding.resource,
      agentId,
    ).catch((e) =>
      console.warn(
        `[native-chat-store] thread pre-register skipped: ${
          (e as Error)?.message || e
        }`,
      ),
    );
  }
}

// The tenant's learned digest (shared "Agent knowledge") woven into the turn,
// plus attachment content-building. The digest is separate from Mastra Memory;
// best-effort (null on error) and skipped for scheduled runs (weaveDigest=false),
// whose prompt is run verbatim.
async function buildTurnConvo(args: {
  models: IModels;
  agentId: string;
  message: string;
  weaveDigest: boolean;
  attachments: IMastraChatAttachment[] | undefined;
  settings: IMastraSettingsDocument;
}): Promise<{ convo: TurnMessage[]; learningIds: string[] }> {
  const { models, agentId, message, weaveDigest, attachments, settings } = args;

  const digest = weaveDigest ? await readLearnedDigest(models, agentId) : null;

  // Mastra Memory replays recent history + recall itself, so generate() gets
  // ONLY the new user message (+ the learned digest). Passing replayed history
  // here would stop Mastra from persisting the turn to its store.
  const convo: TurnMessage[] = augmentConvo({
    recentHistory: [],
    userMessage: message,
    recallBlock: null,
    workingMemoryBlock: null,
    learnedDigestBlock: digest?.block,
  });

  // Attachments reshape the final user turn: manifest text + inlined image
  // parts. The persisted message keeps the raw text; only the LLM convo is
  // augmented. (augmentConvo always places the user message last.)
  if (attachments?.length) {
    const content = await buildChatUserContent({
      message,
      attachments,
      erxesApiUrl: settings?.erxesApiUrl || 'http://localhost:4000',
    });
    convo[convo.length - 1] = { role: 'user', content };
  }

  return { convo, learningIds: digest?.ids ?? [] };
}

// Explicit slash-activation force-loads the chosen skill's FULL instructions into
// this turn (vs. the native skill tool, which the model may never call). Resolved
// through the reachable set so a crafted name can't reach a skill the user can't:
// the agent's globs still gate which GLOBAL skills are reachable, but a user's OWN
// published skill is always reachable, so an explicit activation works on any
// agent — matching what the slash palette offers. No store hit unless something
// is activated.
async function activateTurnSkills(args: {
  userId: string | undefined;
  activeSkillNames: string[] | undefined;
  subdomain: string;
  agentConfig: IMastraAgentDocument;
}): Promise<{ instructions: string; names: string[] } | undefined> {
  const { userId, activeSkillNames, subdomain, agentConfig } = args;
  return userId && activeSkillNames?.length
    ? buildActivatedSkillsBlock(
        subdomain,
        userId,
        agentConfig.skills ?? [],
        activeSkillNames,
      )
    : undefined;
}

export interface PrepareTurnParams {
  models: IModels;
  subdomain: string;
  identity: TurnIdentity;
  agentId: string;
  message: string;
  threadId?: string;
  attachments?: IMastraChatAttachment[];
  approvedOperations?: ApprovedOp[];
  // Weave the tenant's learned digest into the convo (and stamp its ids onto
  // the turn). On for chat/bot; off for scheduled runs (whose prompt is run
  // verbatim, the pre-generalization behaviour).
  weaveDigest?: boolean;
  // Skill names the user explicitly slash-activated for THIS turn.
  activeSkillNames?: string[];
}

export async function prepareTurn(
  params: PrepareTurnParams,
): Promise<PreparedTurn> {
  const {
    models,
    subdomain,
    identity,
    agentId,
    message,
    threadId,
    attachments,
    approvedOperations,
    weaveDigest = true,
    activeSkillNames,
  } = params;

  assertAgentId(agentId);

  const { agentConfig, settings, providers } = await readTurnConfig(
    models,
    identity,
    agentId,
  );

  const sessionId = deriveSessionId(threadId);

  const {
    advanced,
    resourceId,
    useMemory,
    userHeader,
    token,
    memCtx,
    memoryBinding,
  } = resolveTurnMemory({
    identity,
    agentConfig,
    agentId,
    message,
    subdomain,
    sessionId,
  });

  const { agent, tools, skipSemanticRecall } = await buildAgentAndGateMemory({
    agentConfig,
    models,
    subdomain,
    settings,
    providers,
    identity,
    threadId,
    sessionId,
    memoryBinding,
  });
  if (memoryBinding && skipSemanticRecall) {
    memoryBinding.options = { semanticRecall: false };
  }

  await preRegisterThread({
    identity,
    memoryBinding,
    subdomain,
    sessionId,
    agentId,
  });

  const { convo, learningIds } = await buildTurnConvo({
    models,
    agentId,
    message,
    weaveDigest,
    attachments,
    settings,
  });

  // Only an in-app user can slash-activate skills (bot/schedule turns carry no
  // composer). The user's id resolves their own reachable skills below.
  const userId = identity.kind === 'user' ? identity.user?._id : undefined;

  const activated = await activateTurnSkills({
    userId,
    activeSkillNames,
    subdomain,
    agentConfig,
  });

  const authCtx = {
    userHeader,
    // Interactive turns forward the user's own login token; bot/schedule turns
    // (no login token) fall back to the configured app token.
    token: token ?? settings?.erxesApiToken,
    userId,
    threadId: sessionId,
    agentId,
    subdomain,
    turnId: randomUUID(),
    turnStartedAt: new Date(),
    turnPrompt: (message || '').slice(0, 200),
    resourceId,
    approvedOps: approvedOperations,
  };

  return {
    agentConfig,
    settings,
    providers,
    // The published Agent generics type tool results as wire chunks; the
    // runtime objects this pipeline reads are the duck-typed shapes in
    // ToolResultLike, hence the structural cast (cf. titler.ts).
    agent: agent as unknown as TurnAgent,
    tools,
    sessionId,
    convo,
    authCtx,
    advanced,
    useMemory,
    memoryBinding,
    memCtx,
    attachments,
    learningIds,
    activeSkillInstructions: activated?.instructions,
    appliedSkillNames: activated?.names ?? [],
  };
}

// Thin wrapper for the in-app chat path (SSE route + mastraAgentChat resolver),
// kept so those callers stay stable. Delegates to the generalized prepareTurn.
export async function prepareChatTurn(params: {
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  agentId: string;
  message: string;
  threadId?: string;
  attachments?: IMastraChatAttachment[];
  approvedOperations?: ApprovedOp[];
  // Skill names the user explicitly slash-activated for THIS turn.
  activeSkillNames?: string[];
}): Promise<PreparedTurn> {
  const { user, ...rest } = params;
  return prepareTurn({ ...rest, identity: { kind: 'user', user } });
}
