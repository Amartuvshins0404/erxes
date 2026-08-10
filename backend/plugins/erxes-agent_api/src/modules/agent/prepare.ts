import { randomUUID } from 'node:crypto';
import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { canUserAccessAgent, getUserUnitIds } from '@/agent/utils';
import { IModels } from '~/connectionResolvers';
import { getOrCreateAgent } from '~/mastra/agentRuntime';
import { isAdvancedMemoryEnabled } from '~/mastra/memory/config';
import { scopedResource } from '~/mastra/memory/mastraMemory';
import { deriveResourceId, augmentConvo, MemoryContext } from '~/mastra/memory';
import { readLearnedDigest } from '~/mastra/learning/digest';
import { ApprovedOp } from '~/mastra/requestContext';
import { buildChatUserContent } from '~/mastra/files/chatContent';
import { IMastraChatAttachment } from '@/session/@types/session';
import { ensureThreadRegistered, getNativeMemory } from '@/session/nativeStore';
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
import { requireActionScope } from '@/_shared/authorization';
import { ERXES_AGENT_ACTIONS } from '~/meta/permissionActions';

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
  subdomain: string,
  identity: TurnIdentity,
  agentId: string,
): Promise<TurnConfig> {
  const [agentConfig, settings, providers, unitIds, actionScope] =
    await Promise.all([
      models.MastraAgent.findOne({ agentId, isEnabled: true }),
      models.MastraSettings.getSettings(),
      models.MastraProvider.find({ isEnabled: true }),
      identity.kind === 'user' && identity.user
        ? getUserUnitIds(models, identity.user._id)
        : Promise.resolve<string[]>([]),
      identity.kind === 'user' && identity.user
        ? requireActionScope({
            subdomain,
            user: identity.user,
            action: ERXES_AGENT_ACTIONS.agent.chat,
          })
        : Promise.resolve(null),
    ]);
  if (!agentConfig)
    throw new ExpectedError(`Agent "${agentId}" not found or disabled`);

  if (identity.kind === 'user' && identity.user) {
    if (
      !canUserAccessAgent(
        agentConfig,
        identity.user._id,
        actionScope ?? 'own',
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
  const { identity, agentConfig, agentId, message, subdomain, sessionId } =
    args;

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
  // store: it persists the turn, replays recent history, and runs working
  // memory via the per-turn binding below. An unknown tenant does NOT skip
  // persistence — scopedResource defaults an empty subdomain to the "os" scope
  // so the thread is still persisted and listable.
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

// Build the agent and read the thread (ownership + thread-history)
// concurrently. Neither needs the other's result, so they overlap instead of
// stacking round trips. Enforces the ownership gate.
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

  const needsThreadRead = Boolean(
    identity.kind === 'user' &&
      memoryBinding &&
      typeof threadId === 'string' &&
      threadId,
  );
  const [{ agent, tools }, priorThread] = await Promise.all([
    getOrCreateAgent(agentConfig, models, subdomain, {
      settings,
      providers,
    }),
    needsThreadRead
      ? getNativeMemory(subdomain).then((m) =>
          m.getThreadById({ threadId: sessionId }),
        )
      : Promise.resolve(null),
  ]);

  // Continued threads must belong to the caller. A thread under another
  // resource is reported as not found; bot resources are synthetic/self-scoped.
  if (
    priorThread &&
    memoryBinding &&
    priorThread.resourceId !== memoryBinding.resource
  ) {
    throw new ExpectedError('Thread not found');
  }

  return { agent, tools };
}

// Register before execution so a refresh can restore an in-flight session.
// Best-effort: persistence failures must not block the turn.
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
    subdomain,
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

  const { agent, tools } = await buildAgentAndGateMemory({
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

  // Only an in-app user can slash-activate skills; bot turns have no composer.
  const userId = identity.kind === 'user' ? identity.user?._id : undefined;

  const activated = await activateTurnSkills({
    userId,
    activeSkillNames,
    subdomain,
    agentConfig,
  });

  const authCtx = {
    userHeader,
    // Interactive turns forward the user's login token; bot turns without one
    // fall back to the configured app token.
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
