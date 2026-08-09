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
  synthesizeFromToolResults,
  type PreparedTurn,
} from '@/agent/turn';
import { IMastraChatAttachment } from '@/session/@types/session';
import { UITurnAccumulator } from '@/agent/uiTurn';
import {
  resolveGuardedReply,
  shouldGuardProviderOutput,
} from './providerOutputGuard';
import { ensureWebsiteDeliveryReply } from '@/agent/websiteDelivery';

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
          sendReasoning: false,
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
  message: string;
  bufferProviderText: boolean;
  guardProviderText: boolean;
}): Promise<void> {
  const {
    writer,
    models,
    controller,
    clientGone,
    prepared,
    acc,
    message,
    bufferProviderText,
    guardProviderText,
  } = params;
  const { agent, authCtx } = prepared;

  const interrupted = controller.signal.aborted;
  const guarded = guardProviderText
    ? resolveGuardedReply({
        latestText: acc.latestText,
        allText: acc.text,
      })
    : undefined;
  let reply: string | null = guarded ? guarded.text : acc.text || null;
  let emitReply = bufferProviderText;

  if (!reply) {
    // No answer text streamed. When the turn ran to completion the model ended
    // on tool calls without prose — synthesize a summary from the tool results
    // (synthesizeFromToolResults skips synthesis when nothing real came back, so
    // we never fabricate success). An interrupted turn leaves tool calls
    // half-done, so we don't synthesize; we go straight to the fallback below.
    if (!interrupted) {
      const toolResults = acc.toolResults();
      if (toolResults.length) {
        reply = await synthesizeFromToolResults({
          agent,
          message,
          authCtx,
          toolResults,
        });
      }
    }
    // Safety net: a turn must never dead-end as a blank bubble. If nothing
    // streamed and synthesis produced nothing (interrupted mid-tool, or the
    // model stopped on a tool call whose result carried nothing to report),
    // write an explicit line so the user always sees — and can retry — the
    // outcome. This is streamed AND persisted (persistTurn takes `reply`), so it
    // survives a reload too.
    if (!reply) {
      reply = interrupted
        ? 'This response was interrupted before it finished. Please tap retry to continue.'
        : "I couldn't produce a response for that. Please try again.";
    }
    emitReply = true;
  }

  let deliveryCorrected = false;
  if (!interrupted) {
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

  if (emitReply) {
    const id = interrupted ? `interrupt-${Date.now()}` : `synth-${Date.now()}`;
    writer.write({ type: 'text-start', id });
    writer.write({ type: 'text-delta', id, delta: reply });
    writer.write({ type: 'text-end', id });
  }

  // Close the assistant message NOW — the full reply already streamed, so nothing
  // user-visible should wait on the turn-end DB write. The native message id
  // (rated without a reload) and the thread title are reconciled over the
  // still-open stream once the background persist resolves; on a reload the
  // message recovers its id from the store regardless.
  writer.write({
    type: 'finish',
    messageMetadata: {
      messageId: null,
      interrupted,
    },
  });

  // Persistence is off the critical path. The user-visible reply is already
  // complete; this reconciles the native id, attachments, and title.
  const persistPromise = persistTurn({
    models,
    prepared,
    reply,
    // Mastra's assigned id for this turn's assistant row, captured off the
    // stream's `start` chunk — the id the client rates without a reload.
    assistantMessageId: acc.messageId,
    replaceNativeText: bufferProviderText || deliveryCorrected,
    hasArtifacts: (prepared.authCtx.artifactCount ?? 0) > 0,
  });

  if (clientGone()) {
    // Nobody is waiting — let the write finish in the background, surfacing any
    // failure so a lost turn is visible.
    void persistPromise.catch((e) =>
      console.warn(
        `[mastra chat] background persist failed: ${
          (e as Error)?.message || e
        }`,
      ),
    );
  } else {
    // Client still connected: forward the reconciled native id + the new sidebar
    // title over the already-open stream. This runs AFTER `finish`, so it is off
    // the felt path — the user has the complete, rendered reply. Bounded titling:
    // a slow/failed title never hangs the stream (it self-persists for the next
    // session-list load).
    try {
      const { titlePromise, assistantMessageId } = await persistPromise;
      if (assistantMessageId && !clientGone()) {
        writer.write({
          type: 'data-message-id',
          data: { messageId: assistantMessageId },
          transient: true,
        });
      }
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
  }
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
    const guardProviderText = shouldGuardProviderOutput(
      prepared.agentConfig.model,
    );
    const bufferProviderText =
      guardProviderText ||
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

    await foldModelStream({
      writer,
      controller,
      prepared,
      reasoningOptions,
      acc,
      activity,
      bufferProviderText,
    });

    activity.stop();

    await finalizeTurn({
      writer,
      models,
      controller,
      clientGone,
      prepared,
      acc,
      message,
      bufferProviderText,
      guardProviderText,
    });
  } finally {
    activity?.stop();
  }
}
