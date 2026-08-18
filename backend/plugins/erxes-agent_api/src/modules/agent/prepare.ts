import { randomUUID } from 'node:crypto';
import { IUserDocument } from 'erxes-api-shared/core-types';
import { ExpectedError } from 'erxes-api-shared/utils';
import { IModels } from '~/connectionResolvers';
import { buildTurnSystemPrompt, getOrCreateAgent } from '~/mastra/agentRuntime';
import { isWorkspaceMemoryEnabled } from '~/mastra/memory/config';
import { scopedResource } from '~/mastra/memory/mastraMemory';
import { deriveResourceId, augmentConvo, MemoryContext } from '~/mastra/memory';
import { ApprovedOp } from '~/mastra/requestContext';
import { buildChatUserContent } from '~/mastra/files/chatContent';
import { IMastraChatAttachment } from '@/session/@types/session';
import { ensureThreadRegistered, getNativeMemory } from '@/session/nativeStore';
import { IMastraAgentDocument } from '@/agent/@types/agent';
import { IMastraProviderDocument } from '@/provider/@types/provider';
import { IMastraSettingsDocument } from '@/settings/@types/settings';
import { resolveAgentPrincipal } from '~/mastra/auth/agentPrincipal';
import { deriveThreadTitle } from '~/mastra/titler';
import { selectTurnActiveTools } from '~/mastra/turnToolScope';
import {
  MemoryBinding,
  PreparedTurn,
  TurnAgent,
  TurnMessage,
} from '@/agent/types';

// Turn setup: everything a typed chat turn needs before the model runs — agent
// and tools, thread ownership, replayed history, memory, and tool auth.
// Throws user-facing errors on bad agent/thread.

// Chat resources belong to the initiating user while erxes operations run as
// the selected AI team member.
function resolveIdentity(
  user: IUserDocument,
  agentId: string,
  advanced: boolean,
) {
  return {
    resourceId: deriveResourceId({ user, agentId }),
    useMemory: advanced,
  };
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

// Read runtime configuration. Core account status and permissions are checked
// by resolveAgentPrincipal before any model/tool execution.
async function readTurnConfig(
  models: IModels,
  agentId: string,
  providerOwnerId?: string,
): Promise<TurnConfig> {
  const [agentConfig, settings, providers] = await Promise.all([
    models.MastraAgent.findOne({ _id: agentId }),
    models.MastraSettings.getSettings(),
    models.MastraProvider.getRuntimeProviders(providerOwnerId),
  ]);
  if (!agentConfig) {
    throw new ExpectedError(`AI team member "${agentId}" was not found`);
  }
  return { agentConfig, settings, providers };
}

interface TurnMemory {
  advanced: boolean;
  resourceId: string;
  useMemory: boolean;
  memCtx: MemoryContext;
  memoryBinding?: MemoryBinding;
}

// Resolve the user's resource and per-turn Mastra Memory binding.
function resolveTurnMemory(args: {
  user: IUserDocument;
  settings: IMastraSettingsDocument;
  agentId: string;
  subdomain: string;
  sessionId: string;
}): TurnMemory {
  const { user, settings, agentId, subdomain, sessionId } = args;

  const advanced = isWorkspaceMemoryEnabled(settings);

  const { resourceId, useMemory } = resolveIdentity(user, agentId, advanced);

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
    threadId,
    sessionId,
    memoryBinding,
  } = args;

  const needsThreadRead = Boolean(
    memoryBinding && typeof threadId === 'string' && threadId,
  );
  const [{ agent, tools, promptContext }, priorThread] = await Promise.all([
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
  // resource is reported as not found.
  if (
    priorThread &&
    memoryBinding &&
    priorThread.resourceId !== memoryBinding.resource
  ) {
    throw new ExpectedError('Thread not found');
  }

  return { agent, tools, promptContext };
}

// Register before execution so a refresh can restore an in-flight session.
// Best-effort: persistence failures must not block the turn.
async function preRegisterThread(args: {
  memoryBinding: MemoryBinding | undefined;
  subdomain: string;
  sessionId: string;
  agentId: string;
  message: string;
}): Promise<void> {
  const { memoryBinding, subdomain, sessionId, agentId, message } = args;
  if (memoryBinding) {
    await ensureThreadRegistered(
      subdomain,
      sessionId,
      memoryBinding.resource,
      agentId,
      deriveThreadTitle(message),
    ).catch((e) =>
      console.warn(
        `[native-chat-store] thread pre-register skipped: ${
          (e as Error)?.message || e
        }`,
      ),
    );
  }
}

// Build the new user turn. Mastra Memory replays recent history and recall, so
// passing replayed messages here would stop Mastra from persisting the turn.
async function buildTurnConvo(args: {
  message: string;
  attachments: IMastraChatAttachment[] | undefined;
  settings: IMastraSettingsDocument;
}): Promise<TurnMessage[]> {
  const { message, attachments, settings } = args;
  const convo: TurnMessage[] = augmentConvo({
    recentHistory: [],
    userMessage: message,
  });

  // Attachments reshape the final user turn: manifest text + inlined image
  // parts. The persisted message keeps the raw text; only the LLM input changes.
  if (attachments?.length) {
    const content = await buildChatUserContent({
      message,
      attachments,
      erxesApiUrl: settings.erxesApiUrl || 'http://localhost:4000',
    });
    convo[convo.length - 1] = { role: 'user', content };
  }

  return convo;
}

export interface PrepareChatTurnParams {
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  agentId: string;
  message: string;
  threadId?: string;
  attachments?: IMastraChatAttachment[];
  approvedOperations?: ApprovedOp[];
}

export async function prepareChatTurn(
  params: PrepareChatTurnParams,
): Promise<PreparedTurn> {
  const {
    models,
    subdomain,
    user,
    agentId,
    message,
    threadId,
    attachments,
    approvedOperations,
  } = params;

  assertAgentId(agentId);

  const { agentConfig, settings, providers } = await readTurnConfig(
    models,
    agentId,
    user._id,
  );

  const sessionId = deriveSessionId(threadId);

  const { advanced, resourceId, useMemory, memCtx, memoryBinding } =
    resolveTurnMemory({
      user,
      settings,
      agentId,
      subdomain,
      sessionId,
    });
  const principal = await resolveAgentPrincipal({ agentConfig, subdomain });
  if (!principal.ok) {
    throw new ExpectedError(principal.error);
  }

  const initiatorUserId = user._id;

  // Once the acting principal is authorized, the remaining independent reads
  // overlap so turn setup does not stack avoidable round trips.
  const [{ agent, tools, promptContext }, convo] = await Promise.all([
    buildAgentAndGateMemory({
      agentConfig,
      models,
      subdomain,
      settings,
      providers,
      threadId,
      sessionId,
      memoryBinding,
    }),
    buildTurnConvo({ message, attachments, settings }),
  ]);

  const activeTools = selectTurnActiveTools({
    message,
    attachmentCount: attachments?.length ?? 0,
    availableToolNames: Object.keys(tools),
    hasErxesOperations: promptContext.operationToolNames.length > 0,
    skillsEnabled: promptContext.hasRuntimeSkills,
  });
  const turnInstructions = buildTurnSystemPrompt(promptContext, activeTools);

  await preRegisterThread({
    memoryBinding,
    subdomain,
    sessionId,
    agentId,
    message,
  });

  const authCtx = {
    ...principal.authCtx,
    erxesApiUrl: settings.erxesApiUrl || 'http://localhost:4000',
    initiatorUserId,
    threadId: sessionId,
    turnId: randomUUID(),
    turnStartedAt: new Date(),
    turnPrompt: (message || '').slice(0, 200),
    backgroundRemovalEnabled: settings.backgroundRemovalEnabled !== false,
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
    activeTools,
    turnInstructions,
    convo,
    authCtx,
    advanced,
    useMemory,
    memoryBinding,
    memCtx,
    attachments,
  };
}
