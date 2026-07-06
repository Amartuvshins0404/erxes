import type { UIMessageChunk, UIMessageStreamWriter } from 'ai';
import { toAISdkStream } from '@mastra/ai-sdk';
import type { MastraModelOutput } from '@mastra/core/stream';
import { IUserDocument } from 'erxes-api-shared/core-types';
import type { IModels } from '../connectionResolvers';
import {
  ActivityTracker,
  createActivityTracker,
  summarizeActivity,
  summarizeTurnAndSteps,
} from './activity';
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
import { buildTurnSystem } from './voice/voicePrompt';
import { ReasoningBurstCollector } from './reasoningBursts';

// A Mastra stream may expose `traceId` as a value or a promise — sniff and
// resolve it, accepting only a string (a non-string truthy value would slip past
// the falsy guard in pushUserScore and ship bad data to Langfuse).
async function resolveTraceId(
  stream: { traceId?: unknown },
): Promise<string | undefined> {
  const tid = stream.traceId;
  const resolved =
    tid && typeof (tid as PromiseLike<unknown>).then === 'function'
      ? await (tid as Promise<unknown>).catch(() => undefined)
      : tid;
  return typeof resolved === 'string' ? resolved : undefined;
}

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
  // Skill names the user slash-activated in the composer for THIS message.
  activeSkillNames: string[];
  // True when this turn originated from hands-free voice mode: the reply is
  // read aloud by TTS, so the agent should answer short and conversational.
  voiceMode: boolean;
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
// client, assemble the persisted turn artifacts (acc), buffer reasoning bursts,
// and drive the live ActivityTracker. Returns the resolved Langfuse trace id.
// An abort lands in the catch as an interrupt (not an error) on most providers.
async function foldModelStream(params: {
  writer: UIMessageStreamWriter;
  controller: AbortController;
  prepared: PreparedTurn;
  reasoningOptions: ReasoningProviderOptions | undefined;
  turnSystem: string | undefined;
  acc: UITurnAccumulator;
  bursts: ReasoningBurstCollector;
  activity: ActivityTracker | null;
}): Promise<{ langfuseTraceId: string | undefined }> {
  const {
    writer,
    controller,
    prepared,
    reasoningOptions,
    turnSystem,
    acc,
    bursts,
    activity,
  } = params;
  const { agent, convo, authCtx, memoryBinding } = prepared;

  let langfuseTraceId: string | undefined;
  try {
    await runWithAuth(authCtx, async () => {
      const modelStream = await agent.stream(convo, {
        abortSignal: controller.signal,
        ...(memoryBinding ? { memory: memoryBinding } : {}),
        ...(reasoningOptions ? { providerOptions: reasoningOptions } : {}),
        // Per-turn system additions (additive to the agent's base instructions +
        // the native SkillsProcessor metadata): a voice-mode brevity directive
        // when the turn came from speech, plus an explicitly slash-activated
        // skill's full instructions.
        ...(turnSystem ? { system: turnSystem } : {}),
      });
      langfuseTraceId = await resolveTraceId(
        modelStream as { traceId?: unknown },
      );

      // Convert Mastra's native stream to the AI SDK v5 UIMessage chunk stream.
      // sendFinish:false — we emit the final `finish` ourselves after persisting,
      // so it carries the native messageId the client rates. Chunks are
      // structurally the published `ai` UIMessageChunk.
      const uiStream = toAISdkStream(
        modelStream as unknown as MastraModelOutput,
        {
          from: 'agent',
          sendReasoning: true,
          sendSources: false,
          sendFinish: false,
        },
        // Node web ReadableStream is async-iterable at runtime; the DOM lib type
        // doesn't declare it, so iterate via this view.
      ) as unknown as AsyncIterable<UIMessageChunk>;

      for await (const chunk of uiStream) {
        acc.fold(chunk);
        switch (chunk.type) {
          case 'reasoning-delta':
            bursts.append(chunk.delta ?? '');
            activity?.onThinking(chunk.delta ?? '');
            break;
          // The same chunk types that close a reasoning burst in the accumulator
          // (a non-reasoning chunk ends the current burst).
          case 'reasoning-end':
          case 'text-start':
          case 'text-delta':
          case 'tool-input-available':
          case 'tool-input-error':
            bursts.close();
            if (chunk.type === 'tool-input-available')
              activity?.onToolCall(chunk.toolName, chunk.input);
            break;
          default:
            break;
        }
        writer.write(chunk);
      }
      // Flush a burst still open when the model ended on reasoning.
      bursts.close();
      // No flush barrier or post-write needed: Mastra persists the turn's parts
      // natively as it saves the row. persistTurn below only reconciles the
      // thread binding, attachments, title, and the native message id.
    });
  } catch (err) {
    // An abort lands here on most providers — an interrupt, not an error.
    if (!controller.signal.aborted) throw err;
  }
  return { langfuseTraceId };
}

// Finalize the turn once the model stream is done: synthesize a reply from tool
// results when the model produced no prose, emit the manual `finish`, produce
// the run-timeline summaries off the felt path, then persist and reconcile the
// native message id + thread title over the still-open stream.
async function finalizeTurn(params: {
  writer: UIMessageStreamWriter;
  models: IModels;
  controller: AbortController;
  clientGone: () => boolean;
  prepared: PreparedTurn;
  acc: UITurnAccumulator;
  bursts: ReasoningBurstCollector;
  message: string;
  langfuseTraceId: string | undefined;
}): Promise<void> {
  const {
    writer,
    models,
    controller,
    clientGone,
    prepared,
    acc,
    bursts,
    message,
    langfuseTraceId,
  } = params;
  const { agent, authCtx } = prepared;

  const interrupted = controller.signal.aborted;
  let reply: string | null = acc.text || null;

  if (!acc.text) {
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
      langfuseTraceId,
      ...(prepared.appliedSkillNames?.length
        ? { activeSkills: prepared.appliedSkillNames }
        : {}),
    },
  });

  // Run-timeline summaries — the turn headline + each step's gist — are produced
  // together in ONE model call, OFF the felt path (the reply has already
  // streamed, so this never slows the response). Only for turns that did real
  // work (tools or reasoning); a plain answer needs none. Streamed to the live
  // client + persisted; on failure each item degrades to the raw-reasoning lead /
  // no header.
  let turnSummary: string | null = null;
  let reasoningSummaryList: (string | null)[] | undefined;
  const wantSummaries =
    !interrupted &&
    !!reply &&
    (acc.toolCalls.length > 0 || bursts.bursts.length > 0);
  if (wantSummaries) {
    const { turn, steps } = await summarizeTurnAndSteps({
      provider: prepared.agentConfig.provider,
      model: prepared.agentConfig.model,
      providers: prepared.providers,
      authCtx,
      userMessage: message,
      reply,
      steps: bursts.bursts,
    });
    turnSummary = turn;
    if (steps.length) {
      const byIndex: (string | null)[] = [];
      for (const s of steps) byIndex[s.index] = s.summary;
      reasoningSummaryList = Array.from(byIndex, (s) => s ?? null);
    }
    if (!clientGone()) {
      if (turnSummary)
        writer.write({
          type: 'data-turn-summary',
          data: { text: turnSummary },
          transient: true,
        });
      if (reasoningSummaryList)
        writer.write({
          type: 'data-reasoning-summaries',
          data: { summaries: reasoningSummaryList },
          transient: true,
        });
    }
  }

  // Persistence OFF the critical path. Mastra persists the turn's parts natively
  // as it saves the row; persistTurn now only reconciles the thread binding, any
  // user-message attachments, the per-step summaries, the title, and the native
  // message id. We never block `finish` on it, but we never drop it (errors are
  // logged, not swallowed).
  const persistPromise = persistTurn({
    models,
    prepared,
    reply,
    reasoningSummaries: reasoningSummaryList,
    turnSummary: turnSummary ?? undefined,
    // Mastra's assigned id for this turn's assistant row, captured off the
    // stream's `start` chunk — the id the client rates without a reload.
    assistantMessageId: acc.messageId,
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

// The full assistant turn for POST /chat/stream: prepare → set up activity
// narration → run + fold the model stream → finalize (synthesize, finish,
// summarize, persist/reconcile). Writes to `writer` and persists; observable
// behavior (chunk order, finish metadata, persistence, client-gone handling,
// abort semantics) matches the former inline route closure exactly.
export async function streamAgentTurn(deps: StreamAgentTurnDeps): Promise<void> {
  const { writer, models, subdomain, user, controller, clientGone, request } =
    deps;
  const {
    agentId,
    message,
    threadId,
    reasoningEffort,
    attachments,
    approvedOperations,
    activeSkillNames,
    voiceMode,
  } = request;

  // Folds the model's UIMessage chunks into the erxes-only turn artifacts we
  // persist (ordered parts, thinking, tool calls). The live render is driven by
  // the chunks themselves — this only assembles what gets written to Mongo.
  const acc = new UITurnAccumulator();
  const bursts = new ReasoningBurstCollector();
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
      activeSkillNames,
    });

    // Per-turn system message: voice brevity directive (voice turns only) + any
    // slash-activated skill instructions. Undefined leaves the agent's base
    // instructions untouched (the typed-chat path).
    const turnSystem = buildTurnSystem({
      voiceMode,
      activeSkillInstructions: prepared.activeSkillInstructions,
    });

    // Per-conversation reasoning override → provider-specific options, resolved
    // once against the agent's provider. Providers without a portable reasoning
    // knob yield undefined, so the model's configured default stands untouched.
    const reasoningOptions = buildReasoningProviderOptions(
      prepared.agentConfig.provider,
      reasoningEffort,
    );

    // Narrates "what is the agent doing" while the turn runs — throttled
    // summaries of the live reasoning/tool signals, pushed as transient
    // `data-activity` parts.
    activity = createActivityTracker({
      userMessage: message,
      emit: (text) => {
        if (!clientGone())
          writer.write({
            type: 'data-activity',
            data: { text },
            transient: true,
          });
      },
      // Tool steps narrate instantly (no LLM); reasoning bursts use the model.
      toolSignal: toolStatusLine,
      summarize: (snapshot) =>
        summarizeActivity({
          provider: prepared.agentConfig.provider,
          model: prepared.agentConfig.model,
          providers: prepared.providers,
          authCtx: prepared.authCtx,
          snapshot,
        }),
    });

    const { langfuseTraceId } = await foldModelStream({
      writer,
      controller,
      prepared,
      reasoningOptions,
      turnSystem,
      acc,
      bursts,
      activity,
    });

    activity.stop();

    await finalizeTurn({
      writer,
      models,
      controller,
      clientGone,
      prepared,
      acc,
      bursts,
      message,
      langfuseTraceId,
    });
  } finally {
    activity?.stop();
  }
}
