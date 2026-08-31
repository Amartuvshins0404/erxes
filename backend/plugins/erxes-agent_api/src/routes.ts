import type { UIMessage } from 'ai' with { 'resolution-mode': 'import' };
import type { MastraMemory } from '@mastra/core/memory' with {
  'resolution-mode': 'import',
};
import type { Agent } from '@mastra/core/agent' with {
  'resolution-mode': 'import',
};
import type { RequestContext } from '@mastra/core/request-context' with {
  'resolution-mode': 'import',
};
import type { IAiAgentConnection } from 'erxes-api-shared/core-modules';
import { randomUUID } from 'crypto';
import express, { Router } from 'express';
import { extractUserFromHeader, getSubdomain } from 'erxes-api-shared/utils';
import { buildAgentsAgent, isAgentsThinkingLevel, type IAgentsThinkingLevel } from '@/agents/agent';
import { getAgentsRuntime } from '@/agents/memory';
import { publishAgentsThreadsChanged } from '@/agents/threadsEvents';
import type { IAgentsToolContext } from '@/agents/tools';
import { registerCfOsRoutes } from '@/cfos/routes';
import { generateModels, type IModels } from './connectionResolvers';

/**
 * HTTP surface for the agents chat API.
 *
 * The agents module is a single agent built per request from one of the
 * acting user's BYOK connections (multiple providers may be stored, managed
 * through the `agentsConnections` GraphQL surface); there are no agent
 * definition documents. Each turn carries an optional provider/model pick
 * and a thinking level from the chat UI.
 *
 * - `POST /agents/chat` streams an AI SDK v7 UI message stream over SSE
 *   from that per-request Mastra agent. Only the newest client message is
 *   forwarded; history is loaded from and persisted to Mastra memory, keyed
 *   by `threadId` (response header `X-Agents-Thread-Id`) and the acting
 *   user as resource.
 * - `POST /agents/approve` decides a run suspended on a destructive (or
 *   always-confirm) tool call: `{ threadId, approved, reason? }`. It resolves
 *   the held tool call and calls Mastra's `approveToolCall` (execute it and
 *   continue the stream) or `declineToolCall` (skip it and tell the model
 *   why). The suspended run is discovered from persistent snapshot storage
 *   scoped to the thread and the acting user.
 * - `POST /agents/answer` answers a run suspended by the plugin's
 *   `ask_user` tool: `{ threadId, answer }`. The suspended run is discovered the same
 *   way (durable snapshots, ownership-checked) and resumed with
 *   `agent.resumeStream(answer)`, so the ask_user call returns the user's
 *   answer inside the model's generation loop and the reply continues from
 *   there through the same SSE pipeline.
 *
 * Thread listing and message reading live in GraphQL (`agentsThreads`,
 * `agentsThreadDetail`) so the sidebar can react to the
 * `agentsThreadsChanged` subscription. Whenever a turn is persisted
 * (Mastra's `onFinish`, fired after memory persistence) or a thread title is
 * generated (Mastra's `memory.onTitleGenerated`), this module publishes the
 * event over the shared Redis pubsub.
 *
 * Threads and messages are persisted by Mastra Memory backed by MongoDBStore
 * over this plugin's shared mongoose connection.
 */

interface IRequestIdentity {
  subdomain: string;
  userId: string;
}

/** Error carrying an HTTP status so route handlers map failures to 4xx/5xx. */
class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const jsonError = (
  res: express.Response,
  status: number,
  error: unknown,
): void => {
  res.status(status).json({
    error: error instanceof Error ? error.message : 'Unexpected error',
  });
};

const getIdentity = (req: express.Request): IRequestIdentity | null => {
  const user = extractUserFromHeader(req.headers);

  if (!user?._id) {
    return null;
  }

  return {
    subdomain: getSubdomain(req),
    userId: user._id,
  };
};

/**
 * Resolves the id a chat turn writes into and enforces ownership:
 * - a client-supplied id must belong to the acting user (403 otherwise),
 * - a missing id is auto-generated (Mastra creates the thread during
 *   `agent.stream` and derives its title from the first message).
 *
 * Mastra auto-creates the thread, so no pre-creation happens here.
 */
const resolveOwnedThreadId = async ({
  memory,
  identity,
  requestedThreadId,
}: {
  memory: MastraMemory;
  identity: IRequestIdentity;
  /** Client-provided thread id, or empty/undefined to start a new thread. */
  requestedThreadId?: string;
}): Promise<string> => {
  const threadId = requestedThreadId?.trim() || randomUUID();

  // Only the acting user may continue an existing thread.
  const existing = await memory.getThreadById({ threadId });

  if (existing && existing.resourceId !== identity.userId) {
    throw new HttpError(403, 'Thread belongs to another user.');
  }

  return threadId;
};

/**
 * Resolves the acting user's stored BYOK connection, shared by chat and
 * approve. Without one the user is told exactly what is missing; the key
 * itself is never echoed into the error.
 */
const resolveUserConnections = async (
  models: IModels,
  userId: string,
): Promise<IAiAgentConnection[]> => {
  const doc = await models.AgentsConnection.getConnections(userId);

  if (!doc || doc.connections.length === 0) {
    throw new HttpError(400, 'Add your API key to start using Agents.');
  }

  return doc.connections;
};

/**
 * Picks the connection a turn runs on: the body's provider when given
 * (validated against the user's stored entries), otherwise the first
 * configured provider. An explicit `model` overrides the stored one for
 * this turn only and is never persisted.
 */
const pickConnection = (
  connections: IAiAgentConnection[],
  provider?: string,
  model?: string,
): IAiAgentConnection => {
  const requestedProvider = provider?.trim();
  const selected = requestedProvider
    ? connections.find(
        (connection) => connection.provider === requestedProvider,
      )
    : connections[0];

  if (!selected) {
    throw new HttpError(
      400,
      `No connection stored for provider "${requestedProvider}". Add it under Settings → API key.`,
    );
  }

  const requestedModel = model?.trim();

  return requestedModel ? { ...selected, model: requestedModel } : selected;
};

const parseThinkingLevel = (value: unknown): IAgentsThinkingLevel =>
  isAgentsThinkingLevel(value) ? value : 'off';

/**
 * Reads the tenant's code-mode flag so chat and both resume routes build
 * the agent with (or without) the sandboxed code tool; a resumed run keeps
 * the tool set of the turn that suspended, so the flag rides along here.
 */
const resolveCodeMode = async (
  models: IModels,
): Promise<{ enabled: boolean }> => {
  const settings = await models.AgentsSettings.getSettings();

  return { enabled: settings.codeModeEnabled === true };
};

/**
 * Stamps the acting user into a Mastra RequestContext so the two-tier tools
 * (searchTools/callTool) can validate and execute as that user. Identity
 * always comes from the gateway headers, never from the request body.
 */
const buildToolRequestContext = async (
  identity: IRequestIdentity,
): Promise<RequestContext<IAgentsToolContext>> => {
  // @mastra/core/request-context is ESM-only; load it dynamically.
  const { RequestContext: RequestContextCtor } = await import(
    '@mastra/core/request-context'
  );
  const requestContext = new RequestContextCtor<IAgentsToolContext>();

  requestContext.set('subdomain', identity.subdomain);
  requestContext.set('userId', identity.userId);

  return requestContext;
};

type IAgentStream = Awaited<ReturnType<Agent['stream']>>;

/**
 * Readable client-facing message for a failed model stream. Provider errors
 * (rate limits, unsupported parameters, invalid keys) carry actionable text
 * and no secrets — the API key never appears in an error body — so the
 * message is forwarded instead of a generic dead end.
 */
const describeStreamError = (error: unknown): string => {
  const message = error instanceof Error ? error.message.trim() : '';

  return message || 'The model failed to generate a response.';
};

/**
 * Streams a Mastra model output to the response as an AI SDK v7 UI message
 * stream, exposing the conversation id before streaming starts so clients
 * can continue the same thread on their next request.
 */
const pipeAgentStream = async (
  res: express.Response,
  threadId: string,
  stream: IAgentStream,
): Promise<void> => {
  res.setHeader('X-Agents-Thread-Id', threadId);

  // 'ai' and '@mastra/ai-sdk' are ESM-only; load them dynamically from
  // CommonJS.
  const { pipeUIMessageStreamToResponse } = await import('ai');
  const { toAISdkStream } = await import('@mastra/ai-sdk');

  pipeUIMessageStreamToResponse({
    response: res,
    stream: toAISdkStream(stream, {
      from: 'agent',
      version: 'v7',
      // Log the underlying failure server-side for diagnosis while the
      // client receives the provider's readable message.
      onError: (error) => {
        console.error('[erxes-agent] chat stream failed:', error);

        return describeStreamError(error);
      },
    }),
  });
};

export const router: Router = Router();

// cf-os passwordless dashboard sign-in (mint + gatekeeper exchange). The
// cf_os_ui plugin calls `/pl:erxes-agent/cf-os/connect-code`.
registerCfOsRoutes(router);

router.post('/agents/chat', async (req, res) => {
  const identity = getIdentity(req);

  if (!identity) {
    jsonError(res, 401, new Error('Authentication required'));
    return;
  }

  const body = (req.body || {}) as {
    messages?: UIMessage[];
    threadId?: string;
    provider?: string;
    model?: string;
    thinkingLevel?: string;
  };

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    jsonError(res, 400, new Error('`messages` must be a non-empty array'));
    return;
  }

  // Mastra memory loads history from storage itself; forwarding the whole
  // client transcript would duplicate messages and risks ordering conflicts
  // with stored timestamps (see Mastra's message-history guidance).
  const newestMessage = body.messages[body.messages.length - 1];

  if (!newestMessage || newestMessage.role !== 'user') {
    jsonError(res, 400, new Error('The newest message must be from the user.'));
    return;
  }

  try {
    const models = await generateModels(identity.subdomain);
    const connections = await resolveUserConnections(models, identity.userId);
    const connection = pickConnection(
      connections,
      body.provider,
      body.model,
    );
    const thinkingLevel = parseThinkingLevel(body.thinkingLevel);
    const runtime = await getAgentsRuntime(identity.subdomain);
    const threadId = await resolveOwnedThreadId({
      memory: runtime.memory,
      identity,
      requestedThreadId: body.threadId,
    });

    const agent = await buildAgentsAgent({
      connection,
      memory: runtime.memory,
      mastra: runtime.mastra,
      thinkingLevel,
      codeMode: await resolveCodeMode(models),
    });

    const requestContext = await buildToolRequestContext(identity);

    // Mastra fires `onFinish` after the run's messages are persisted, and
    // `onTitleGenerated` later, once the asynchronous thread title lands —
    // both are the moments the sidebar must refresh, so each publishes the
    // per-user `agentsThreadsChanged` event over the shared Redis pubsub.
    const stream = await agent.stream([newestMessage], {
      memory: {
        thread: threadId,
        resource: identity.userId,
        onTitleGenerated: () => publishAgentsThreadsChanged(identity.userId),
      },
      onFinish: () => publishAgentsThreadsChanged(identity.userId),
      requestContext,
    });

    await pipeAgentStream(res, threadId, stream);
  } catch (error) {
    const status = error instanceof HttpError ? error.statusCode : 500;

    jsonError(res, status, error);
  }
});

router.post('/agents/approve', async (req, res) => {
  const identity = getIdentity(req);

  if (!identity) {
    jsonError(res, 401, new Error('Authentication required'));
    return;
  }

  const body = (req.body || {}) as {
    threadId?: string;
    approved?: boolean;
    reason?: string;
    provider?: string;
    model?: string;
    thinkingLevel?: string;
  };

  const threadId =
    typeof body.threadId === 'string' ? body.threadId.trim() : '';

  if (!threadId) {
    jsonError(res, 400, new Error('`threadId` is required.'));
    return;
  }

  if (typeof body.approved !== 'boolean') {
    jsonError(res, 400, new Error('`approved` must be true or false.'));
    return;
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  try {
    const models = await generateModels(identity.subdomain);
    const connections = await resolveUserConnections(models, identity.userId);
    // The resumed run continues on the same provider/model the UI used for
    // the suspended turn; the UI resends them with the decision.
    const connection = pickConnection(
      connections,
      body.provider,
      body.model,
    );
    const thinkingLevel = parseThinkingLevel(body.thinkingLevel);
    const runtime = await getAgentsRuntime(identity.subdomain);

    // Same ownership contract as chat and message reads: only the acting
    // user may resume a run suspended in their own thread.
    const thread = await runtime.memory.getThreadById({ threadId });

    if (!thread) {
      jsonError(res, 404, new Error('Thread not found.'));
      return;
    }

    if (thread.resourceId !== identity.userId) {
      jsonError(res, 403, new Error('Thread belongs to another user.'));
      return;
    }

    const agent = await buildAgentsAgent({
      connection,
      memory: runtime.memory,
      mastra: runtime.mastra,
      thinkingLevel,
      codeMode: await resolveCodeMode(models),
    });

    // Suspended runs live in persistent snapshot storage (the shared
    // MongoDBStore's workflows domain), so discovery works across requests
    // and restarts. Results are newest-first; the newest suspended run is
    // the one awaiting this decision. Scoping by thread + resource means a
    // user can only ever resume their own runs.
    const { runs } = await agent.listSuspendedRuns({
      threadId,
      resourceId: identity.userId,
    });
    const run = runs[0];

    if (!run) {
      jsonError(
        res,
        409,
        new Error('No pending approval exists for this thread.'),
      );
      return;
    }

    const requestContext = await buildToolRequestContext(identity);

    // Mastra scopes each approval to a specific tool call. The suspended run
    // reports the held call's `toolCallId`; passing it back approves or
    // declines exactly that call. A resumed run that later invokes another
    // approval-gated tool suspends again under its own toolCallId, so one
    // approval can never execute a different tool.
    const pendingToolCallId = run.toolCalls?.[0]?.toolCallId;
    const toolCallScope = pendingToolCallId
      ? { toolCallId: pendingToolCallId }
      : {};

    // A resumed first-turn run can still be the one that generates the
    // thread's title, so the approve path passes the same title event hook.
    const stream = body.approved
      ? await agent.approveToolCall({
          runId: run.runId,
          ...toolCallScope,
          memory: {
            thread: threadId,
            resource: identity.userId,
            onTitleGenerated: () =>
              publishAgentsThreadsChanged(identity.userId),
          },
          requestContext,
        })
      : await agent.declineToolCall({
          runId: run.runId,
          ...toolCallScope,
          ...(reason ? { reason } : {}),
          memory: {
            thread: threadId,
            resource: identity.userId,
            onTitleGenerated: () =>
              publishAgentsThreadsChanged(identity.userId),
          },
          requestContext,
        });

    await pipeAgentStream(res, threadId, stream);
  } catch (error) {
    const status = error instanceof HttpError ? error.statusCode : 500;

    jsonError(res, status, error);
  }
});

/**
 * Resolves the newest suspended run and the tool call it is waiting on,
 * shared by the approve and answer resume routes. Ownership has already been
 * re-checked by the caller; discovery stays storage-backed so decisions
 * survive restarts. Throws 409 semantics via HttpError when nothing is
 * suspended for the thread.
 */
const findSuspendedToolCall = async (
  agent: Agent,
  identity: IRequestIdentity,
  threadId: string,
): Promise<{
  runId: string;
  toolCallId?: string;
  requiresApproval: boolean;
  suspendPayload?: unknown;
}> => {
  // Suspended runs live in persistent snapshot storage (the shared
  // MongoDBStore's workflows domain), so discovery works across requests
  // and restarts. Results are newest-first; the newest suspended run is
  // the one awaiting this decision. Scoping by thread + resource means a
  // user can only ever resume their own runs.
  const { runs } = await agent.listSuspendedRuns({
    threadId,
    resourceId: identity.userId,
  });
  const run = runs[0];

  if (!run) {
    throw new HttpError(409, 'No pending interaction exists for this thread.');
  }

  const toolCall = run.toolCalls?.[0];

  return {
    runId: run.runId,
    toolCallId: toolCall?.toolCallId,
    requiresApproval: toolCall?.requiresApproval === true,
    suspendPayload: toolCall?.suspendPayload,
  };
};

router.post('/agents/answer', async (req, res) => {
  const identity = getIdentity(req);

  if (!identity) {
    jsonError(res, 401, new Error('Authentication required'));
    return;
  }

  const body = (req.body || {}) as {
    threadId?: string;
    answer?: unknown;
    provider?: string;
    model?: string;
    thinkingLevel?: string;
  };

  const threadId =
    typeof body.threadId === 'string' ? body.threadId.trim() : '';

  if (!threadId) {
    jsonError(res, 400, new Error('`threadId` is required.'));
    return;
  }

  // ask_user accepts free-text and single-select answers (string), a
  // multi-select answer (string array), or — for multi-question
  // suspensions — one answer per question positionally (each element a
  // string or a string array). Anything else is a client bug, not an
  // answer — reject it rather than resuming the run with garbage.
  const isString = typeof body.answer === 'string' && body.answer.trim() !== '';
  const isNonEmptyStringArray = (value: unknown[]): boolean =>
    value.length > 0 &&
    value.every((item) => typeof item === 'string' && item.trim() !== '');
  const isAnswerList =
    Array.isArray(body.answer) &&
    body.answer.length > 0 &&
    body.answer.every(
      (item) =>
        (Array.isArray(item) && isNonEmptyStringArray(item)) ||
        (typeof item === 'string' && item.trim() !== ''),
    );

  if (!isString && !isAnswerList) {
    jsonError(
      res,
      400,
      new Error(
        '`answer` must be a non-empty string, a non-empty string array, or an array of per-question answers.',
      ),
    );
    return;
  }

  const answer: unknown = isString
    ? (body.answer as string).trim()
    : (body.answer as unknown[]).map((item) =>
        Array.isArray(item)
          ? item.map((part) => (typeof part === 'string' ? part.trim() : part))
          : typeof item === 'string'
            ? item.trim()
            : item,
      );

  try {
    const models = await generateModels(identity.subdomain);
    const connections = await resolveUserConnections(models, identity.userId);
    // The resumed run continues on the same provider/model the UI used for
    // the suspended turn; the UI resends them with the answer.
    const connection = pickConnection(
      connections,
      body.provider,
      body.model,
    );
    const thinkingLevel = parseThinkingLevel(body.thinkingLevel);
    const runtime = await getAgentsRuntime(identity.subdomain);

    // Same ownership contract as chat, approve, and message reads: only
    // the acting user may resume a run suspended in their own thread.
    const thread = await runtime.memory.getThreadById({ threadId });

    if (!thread) {
      jsonError(res, 404, new Error('Thread not found.'));
      return;
    }

    if (thread.resourceId !== identity.userId) {
      jsonError(res, 403, new Error('Thread belongs to another user.'));
      return;
    }

    const agent = await buildAgentsAgent({
      connection,
      memory: runtime.memory,
      mastra: runtime.mastra,
      thinkingLevel,
      codeMode: await resolveCodeMode(models),
    });

    const suspended = await findSuspendedToolCall(agent, identity, threadId);

    // An approval suspension must be answered through /agents/approve;
    // resuming it with an answer would execute the gated tool. An ask_user
    // suspension (requiresApproval false) is the one this route resumes.
    if (suspended.requiresApproval) {
      jsonError(
        res,
        409,
        new Error(
          'This thread is waiting for an approval decision, not an answer.',
        ),
      );
      return;
    }

    const requestContext = await buildToolRequestContext(identity);

    // A resumed first-turn run can still be the one that generates the
    // thread's title, so the answer path passes the same title event hook.
    const stream = await agent.resumeStream(answer, {
      runId: suspended.runId,
      ...(suspended.toolCallId ? { toolCallId: suspended.toolCallId } : {}),
      memory: {
        thread: threadId,
        resource: identity.userId,
        onTitleGenerated: () => publishAgentsThreadsChanged(identity.userId),
      },
      requestContext,
    });

    await pipeAgentStream(res, threadId, stream);
  } catch (error) {
    const status = error instanceof HttpError ? error.statusCode : 500;

    jsonError(res, status, error);
  }
});
