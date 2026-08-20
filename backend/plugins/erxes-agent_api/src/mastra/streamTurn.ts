import type { UIMessageChunk, UIMessageStreamWriter } from 'ai';
import { toAISdkStream } from '@mastra/ai-sdk';
import type { MastraModelOutput } from '@mastra/core/stream';
import { IUserDocument } from 'erxes-api-shared/core-types';
import type { IModels } from '../connectionResolvers';
import { type ActivityTracker, createActivityTracker } from './activity';
import { toolStatusLine } from './activity-signals';
import {
  buildReasoningProviderOptions,
  ReasoningProviderOptions,
  ReasoningEffort,
} from './providers';
import { runWithAuth, ApprovedOp } from './requestContext';
import {
  prepareChatTurn,
  persistTurn,
  type PreparedTurn,
} from '@/agent/turn';
import { IMastraChatAttachment } from '@/session/@types/session';
import { UITurnAccumulator } from '@/agent/uiTurn';
import {
  sanitizeProviderText,
  shouldBufferProviderText,
} from './providerOutputGuard';
import { ensureWebsiteDeliveryReply } from '@/agent/websiteDelivery';
import { isAwaitingUserAnswer } from './tools/metaTools';

// Validated POST /chat/stream payload. All shape-checking for the untrusted
// request body lives in routes.ts (parseChatStreamBody); this is the contract it
// produces and streamAgentTurn consumes.
export interface ChatStreamRequest {
  agentId: string;
  message: string;
  threadId?: string;
  reasoningEffort?: ReasoningEffort;
  attachments: IMastraChatAttachment[];
  approvedOperations: ApprovedOp[];
}

// Everything streamAgentTurn needs from the route handler. Dependencies are
// passed explicitly (writer, the abort controller, the clientGone getter, …)
// rather than closed over, so the turn logic is testable in isolation.
export interface StreamAgentTurnDeps {
  writer: UIMessageStreamWriter;
  models: IModels;
  subdomain: string;
  user: IUserDocument;
  controller: AbortController;
  // Read fresh each time — flips true when the client aborts the fetch.
  clientGone: () => boolean;
  request: ChatStreamRequest;
}

// Run the model stream and fold its UIMessage chunks: write each chunk to the
// client, assemble the persisted turn artifacts (acc), and drive deterministic
// tool activity labels. An abort lands in the catch as an interrupt (not an
// error) on most providers.
async function foldModelStream(params: {
  writer: UIMessageStreamWriter;
  controller: AbortController;
  prepared: PreparedTurn;
  reasoningOptions: ReasoningProviderOptions | undefined;
  acc: UITurnAccumulator;
  activity: ActivityTracker | null;
  bufferProviderText: boolean;
}): Promise<void> {
  const {
    writer,
    controller,
    prepared,
    reasoningOptions,
    acc,
    activity,
    bufferProviderText,
  } = params;
  const { agent, convo, authCtx, memoryBinding } = prepared;

  try {
    await runWithAuth(authCtx, async () => {
      const modelStream = await agent.stream(convo, {
        abortSignal: controller.signal,
        activeTools: prepared.activeTools,
        instructions: prepared.turnInstructions,
        // Native incremental persistence: Mastra flushes the message list to
        // memory storage after every generation step, so completed steps survive
        // even when a later step fails or the turn is aborted. The turn-end
        // reconcile in persistTurn then only patches metadata/attachments (and,
        // for zero-step provider failures, creates the row natively skipped).
        savePerStep: true,
        ...(memoryBinding ? { memory: memoryBinding } : {}),
        ...(reasoningOptions ? { providerOptions: reasoningOptions } : {}),
      });
      // Convert Mastra's native stream to the AI SDK v5 UIMessage chunk stream.
      // sendFinish:false — we emit the final `finish` ourselves after persisting,
      // so it carries the native messageId the client rates. Chunks are
      // structurally the published `ai` UIMessageChunk.
      const uiStream = toAISdkStream(
        modelStream as unknown as MastraModelOutput,
        {
          from: 'agent',
          // Reasoning streams through so the UI can show the model's thoughts
          // (Grok-style thought rows); native persistence keeps the parts.
          sendReasoning: true,
          sendSources: false,
          sendFinish: false,
        },
        // Node web ReadableStream is async-iterable at runtime; the DOM lib type
        // doesn't declare it, so iterate via this view.
      ) as unknown as AsyncIterable<UIMessageChunk>;

      for await (const chunk of uiStream) {
        acc.fold(chunk);
        if (chunk.type === 'tool-input-available') {
          activity?.onToolCall(chunk.toolName, chunk.input);
        }
        // Tool input reaches the client only when complete. Forwarding the
        // partial start/delta chunks makes the client serialize incomplete
        // argsText that later mismatches the complete form — assistant-ui's
        // tool tracker then warns on every render for every such call and
        // floods the console until the tab freezes. The AI SDK creates the
        // tool part directly from `tool-input-available`, so nothing is lost.
        if (
          chunk.type === 'tool-input-start' ||
          chunk.type === 'tool-input-delta'
        ) {
          continue;
        }
        if (
          !bufferProviderText ||
          !['text-start', 'text-delta', 'text-end'].includes(chunk.type)
        ) {
          writer.write(chunk);
        }
      }
      // No flush barrier or post-write needed: Mastra persists the turn's parts
      // natively as it saves the row. persistTurn below only reconciles the
      // thread binding, attachments, title, and the native message id.
    });
  } catch (err) {
    // An abort lands here on most providers — an interrupt, not an error.
    if (!controller.signal.aborted) throw err;
  }
}

// Finalize the turn once the model stream is done: synthesize a reply when the
// model produced no prose, emit `finish`, then reconcile persistence off-path.
async function finalizeTurn(params: {
  writer: UIMessageStreamWriter;
  models: IModels;
  controller: AbortController;
  clientGone: () => boolean;
  prepared: PreparedTurn;
  acc: UITurnAccumulator;
  bufferProviderText: boolean;
  // Set when foldModelStream threw — the turn failed before the model
  // finished, so tool state may be partial and no native row will exist.
  streamError?: unknown;
}): Promise<void> {
  const {
    writer,
    models,
    controller,
    clientGone,
    prepared,
    acc,
    bufferProviderText,
    streamError,
  } = params;
  const { authCtx } = prepared;

  const failed = streamError !== undefined && streamError !== null;
  const interrupted = controller.signal.aborted;
  // Buffered providers (Kimi via custom gateways) can leak a reasoning
  // separator late in the stream; only the sanitized text is user-visible.
  let reply: string | null = bufferProviderText
    ? sanitizeProviderText(acc.text).text || null
    : acc.text || null;
  let emitReply = bufferProviderText;

  // A failed stream that already produced text would otherwise look like a
  // complete (if odd) reply. Append an explicit note — streamed now (unless the
  // provider text is still buffered) and persisted with the reply.
  if (failed && reply) {
    const note =
      'Something went wrong while I was working on that. Please try again.';
    if (!emitReply) {
      const id = `fail-${Date.now()}`;
      writer.write({ type: 'text-start', id });
      writer.write({ type: 'text-delta', id, delta: `\n\n${note}` });
      writer.write({ type: 'text-end', id });
    }
    reply = `${reply}\n\n${note}`;
  }

  // The model owns the turn ending; its answer is never second-guessed or
  // rewritten. Only a hard failure or an interruption that left no text gets
  // a plain-language note so the user isn't stranded on a blank bubble. A
  // turn that ended on ask_user is waiting on the user's answer — the chat
  // renders the question card, so it never gets a closing note either (the
  // card IS the outcome).
  const askedUser = acc.toolCalls.some(
    (toolCall) =>
      toolCall.toolName === 'ask_user' &&
      isAwaitingUserAnswer(toolCall.result),
  );
  if (!reply && !askedUser && (interrupted || failed)) {
    reply = interrupted
      ? 'This response was interrupted before it finished. Please tap retry to continue.'
      : 'Something went wrong while I was working on that. Please try again.';
    emitReply = true;
  }

  let deliveryCorrected = false;
  if (!interrupted && reply) {
    const corrected = ensureWebsiteDeliveryReply({
      reply,
      publishAttempted: acc.toolCalls.some(
        (toolCall) => toolCall.toolName === 'publishWebsite',
      ),
      websiteArtifactCount: authCtx.websiteArtifactCount,
    });
    deliveryCorrected = corrected !== reply;
    reply = corrected;
    emitReply ||= deliveryCorrected;
  }

  if (emitReply && reply) {
    const id = interrupted ? `interrupt-${Date.now()}` : `synth-${Date.now()}`;
    writer.write({ type: 'text-start', id });
    writer.write({ type: 'text-delta', id, delta: reply });
    writer.write({ type: 'text-end', id });
  }

  // Persist BEFORE closing the turn: the `finish` chunk carries the reconciled
  // native message id in messageMetadata, which the AI SDK applies to the
  // assistant message and flips the turn to 'ready' at stream close. There is
  // no post-finish reconcile tail — the stream ends right after `finish`.
  // Bounded titling: a slow/failed title never delays the close beyond the
  // race window (it self-persists for the next session-list load anyway).
  let nativeAssistantId: string | null = null;
  try {
    const { titlePromise, assistantMessageId } = await persistTurn({
      models,
      prepared,
      reply,
      // Mastra's assigned id for this turn's assistant row, captured off the
      // stream's `start` chunk — the id the client rates without a reload.
      assistantMessageId: acc.messageId,
      replaceNativeText: bufferProviderText || deliveryCorrected,
      interrupted,
      failed,
      hasArtifacts: (prepared.authCtx.artifactCount ?? 0) > 0,
    });
    nativeAssistantId = assistantMessageId;

    const title = await Promise.race([
      titlePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
    ]);
    if (title && !clientGone()) {
      writer.write({
        type: 'data-thread-title',
        data: { threadId: prepared.sessionId, title },
        transient: true,
      });
    }
  } catch (e) {
    console.warn(
      `[mastra chat] persist/title reconcile failed: ${
        (e as Error)?.message || e
      }`,
    );
  }

  writer.write({
    type: 'finish',
    messageMetadata: {
      messageId: nativeAssistantId,
      interrupted,
    },
  });
}

// The full assistant turn for POST /chat/stream: prepare → set up deterministic
// activity labels → run + fold the model stream → finalize and
// persist/reconcile.
// Observable behavior (chunk order, finish metadata, persistence,
// abort semantics) matches the former inline route closure exactly.
export async function streamAgentTurn(
  deps: StreamAgentTurnDeps,
): Promise<void> {
  const { writer, models, subdomain, user, controller, clientGone, request } =
    deps;
  const {
    agentId,
    message,
    threadId,
    reasoningEffort,
    attachments,
    approvedOperations,
  } = request;

  // Fold reply text and tool results needed to finish the turn. Native memory
  // persists the user-facing message and tool parts.
  const acc = new UITurnAccumulator();
  let activity: ActivityTracker | null = null;

  try {
    const prepared = await prepareChatTurn({
      models,
      subdomain,
      user,
      agentId,
      message,
      threadId,
      attachments,
      approvedOperations,
    });

    // Per-conversation reasoning override → provider-specific options, resolved
    // once against the agent's provider. Providers without a portable reasoning
    // knob yield undefined, so the model's configured default stands untouched.
    const reasoningOptions = buildReasoningProviderOptions(
      prepared.agentConfig.provider,
      reasoningEffort,
    );
    const bufferProviderText =
      (prepared.activeTools.length > 0 &&
        shouldBufferProviderText(prepared.agentConfig.model)) ||
      Object.prototype.hasOwnProperty.call(prepared.tools, 'publishWebsite');

    // Tool calls receive an instant deterministic status line. Reasoning uses
    // the UI's built-in waiting state rather than spending extra model calls on
    // cosmetic narration.
    activity = createActivityTracker({
      emit: (text) => {
        if (!clientGone())
          writer.write({
            type: 'data-activity',
            data: { text },
            transient: true,
          });
      },
      toolSignal: toolStatusLine,
    });

    // A provider/network failure mid-stream must not strand the user on a dead
    // stream: capture it and still finalize, so the turn ends with a streamed
    // AND persisted closing message instead of nothing (the route's onError is
    // the last resort for failures before this point).
    let streamError: unknown = null;
    try {
      await foldModelStream({
        writer,
        controller,
        prepared,
        reasoningOptions,
        acc,
        activity,
        bufferProviderText,
      });
    } catch (err) {
      streamError = err;
      console.error(
        `[mastra chat] model stream failed: ${(err as Error)?.message || err}`,
      );
    }

    activity.stop();

    await finalizeTurn({
      writer,
      models,
      controller,
      clientGone,
      prepared,
      acc,
      bufferProviderText,
      streamError,
    });
  } finally {
    activity?.stop();
  }
}
