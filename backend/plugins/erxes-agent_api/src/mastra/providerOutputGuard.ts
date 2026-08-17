import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
  ProcessOutputStepArgs,
  Processor,
} from '@mastra/core/processors';
import type { ToolResultLike } from '@/agent/types';

const KIMI_REASONING_SEPARATOR = '<|close|>think<|sep|>';
const PROVIDER_CONTROL_TOKEN = /<\|(?:close|sep)\|>/gi;
const KIMI_CODING_MODEL = /(?:^|[/_-])kimi[-_]?for[-_]?coding(?:$|[/_-])/i;

export const INCOMPLETE_PROVIDER_REPLY =
  "I couldn't complete the requested work in this run. Please retry the turn.";

// One corrective attempt is enough. The custom Kimi gateways this guard targets
// have been observed ignoring repeated `toolChoice: required` requests; allowing
// eight retries amplified one user turn into nine provider calls and exhausted
// the provider quota without producing an answer.
export const PROVIDER_COMPLETION_MAX_RETRIES = 1;

export interface GuardedReplyInput {
  latestText: string;
  allText: string;
  /** Structural stall signal from the turn's tool activity. */
  stalled: boolean;
}

export interface GuardedReply {
  text: string | null;
  incomplete: boolean;
  leakedReasoning: boolean;
}

/**
 * Kimi K3 is served through custom OpenAI-compatible gateways in some
 * deployments. Those gateways may put the model's reasoning separator in the
 * normal content stream instead of returning structured reasoning. Buffer its
 * text until the turn ends so a late separator cannot expose an already-sent
 * reasoning prefix.
 */
export function shouldGuardProviderOutput(model: string): boolean {
  return /(?:^|[/_-])kimi[-_]?k3(?:$|[/_-])/i.test(model.trim());
}

/** Models whose tool turns must not settle on promised future work. */
export function shouldGuardProviderCompletion(model: string): boolean {
  const normalized = model.trim();
  return (
    shouldGuardProviderOutput(normalized) || KIMI_CODING_MODEL.test(normalized)
  );
}

export function sanitizeProviderText(raw: string): {
  text: string;
  leakedReasoning: boolean;
} {
  const markerIndex = raw.lastIndexOf(KIMI_REASONING_SEPARATOR);
  const leakedReasoning = markerIndex >= 0;
  const visible = leakedReasoning
    ? raw.slice(markerIndex + KIMI_REASONING_SEPARATOR.length)
    : raw;

  return {
    text: visible.replace(PROVIDER_CONTROL_TOKEN, '').trim(),
    leakedReasoning,
  };
}

// Catalog-discovery tools produce no business data; they only reveal which
// real operations exist. A run whose LAST tool activity is a discovery call
// that found tools — with none of them invoked afterwards — stopped mid-work:
// the model found the capability it needed and then settled on text. This
// signal is structural (tool-call order and payloads only), so it holds
// regardless of the language the model writes in.
const DISCOVERY_TOOLS = new Set(['search_tools', 'load_tool']);

function discoveredToolNames(result: unknown): string[] {
  const results = (result as { results?: unknown } | null | undefined)?.results;
  if (!Array.isArray(results)) return [];
  return results
    .map((entry) => (entry as { name?: unknown } | null | undefined)?.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}

/** True when the turn's tool activity ends on a tool search whose discovered
 *  tools were never called — the structural shape of an unfinished turn. */
export function stalledAfterToolSearch(activity: ToolResultLike[]): boolean {
  const last = activity[activity.length - 1];
  if (!last) return false;
  const toolName = (last.toolName || last.name || '').toLowerCase();
  if (!DISCOVERY_TOOLS.has(toolName)) return false;
  return discoveredToolNames(last.result).length > 0;
}

interface IncompleteTurnMetadata {
  finishReason?: string;
}

// AI SDK step results expose the payload under `output`; Mastra-normalized
// results use `result`. Both are accepted at this external-library boundary.
interface StepToolResult {
  toolName?: string;
  result?: unknown;
  output?: unknown;
}
export interface ProviderStepCompletion {
  toolCallCount: number;
  toolActivity: ToolResultLike[];
}

export function shouldRetryProviderStep(step: ProviderStepCompletion): boolean {
  if (step.toolCallCount > 0) return false;
  return stalledAfterToolSearch(step.toolActivity);
}

/**
 * Reject a step that stops right after a tool search without using any
 * discovered tool. Mastra retries the same step with this feedback, preserving
 * completed tool results while removing the rejected assistant response from
 * the model history.
 */
export class ProviderCompletionGuard
  implements Processor<'provider-completion-guard', IncompleteTurnMetadata>
{
  readonly id = 'provider-completion-guard' as const;
  readonly name = 'Provider completion guard';

  processInputStep({
    retryCount,
    messages,
    activeTools,
    state,
  }: ProcessInputStepArgs<IncompleteTurnMetadata>):
    | ProcessInputStepResult
    | undefined {
    state.hasActiveTools = Boolean(activeTools?.length);
    // The corrective retry only happens after a structural stall, so requiring
    // a tool call cannot break a legitimate plain-text answer — it forces the
    // model to use a discovered tool instead of narrating again.
    return state.hasActiveTools && retryCount > 0
      ? { messages, toolChoice: 'required' }
      : undefined;
  }

  processOutputStep({
    toolCalls,
    steps,
    finishReason,
    retryCount,
    abort,
    messages,
    state,
  }: ProcessOutputStepArgs<IncompleteTurnMetadata>): ProcessOutputStepArgs<IncompleteTurnMetadata>['messages'] {
    const toolActivity: ToolResultLike[] = (steps ?? []).flatMap((step) =>
      ((step.toolResults ?? []) as StepToolResult[]).map((toolResult) => ({
        toolName: toolResult.toolName,
        result: toolResult.result ?? toolResult.output,
      })),
    );

    if (
      !state.hasActiveTools ||
      !shouldRetryProviderStep({
        toolCallCount: toolCalls?.length ?? 0,
        toolActivity,
      })
    ) {
      return messages;
    }

    // The retry already had a forced tool choice. Accept the provider output so
    // resolveGuardedReply can turn it into the stable user-facing fallback
    // instead of throwing the whole turn away or retrying indefinitely.
    if (retryCount >= PROVIDER_COMPLETION_MAX_RETRIES) {
      return messages;
    }

    return abort(
      'The response stopped before completing the request. Do not announce or promise the next action. Perform it now by calling the required tools, and only finish after delivering the requested result.',
      {
        retry: true,
        metadata: { finishReason },
      },
    );
  }
}

/** Resolve the only user-visible text for a buffered provider turn. */
export function resolveGuardedReply(input: GuardedReplyInput): GuardedReply {
  const latest = sanitizeProviderText(input.latestText);
  const all = sanitizeProviderText(input.allText);
  const leakedReasoning = latest.leakedReasoning || all.leakedReasoning;
  const text = latest.text || all.text;
  const incomplete = !text || input.stalled;

  return {
    // Keep an incomplete reply empty so the turn finalizer can prefer completed
    // tool results. Display-only paths apply INCOMPLETE_PROVIDER_REPLY later.
    text: incomplete ? null : text || null,
    incomplete,
    leakedReasoning,
  };
}

/**
 * Read-time safety for turns persisted before the stream guard existed. Native
 * Mastra parts contain every intermediate text block, while `content` is the
 * final assistant text. If a part contains the leaked separator, remove all raw
 * text parts and expose only a sanitized final reply.
 */
export function sanitizePersistedProviderOutput(
  content: string,
  parts: unknown[],
): { content: string; parts: unknown[] } {
  const textParts = parts.filter(
    (part): part is { type: 'text'; text: string } =>
      !!part &&
      typeof part === 'object' &&
      (part as { type?: unknown }).type === 'text' &&
      typeof (part as { text?: unknown }).text === 'string',
  );
  const allText = textParts.map((part) => part.text).join('');
  if (!sanitizeProviderText(allText).leakedReasoning) {
    return { content, parts };
  }

  const resolved = resolveGuardedReply({
    latestText: content,
    allText,
    // Persisted history carries no tool-call order, so the structural stall
    // signal is unavailable here; sanitizing the leaked reasoning is enough.
    stalled: false,
  });
  const safeText = resolved.text || INCOMPLETE_PROVIDER_REPLY;

  return {
    content: safeText,
    parts: [
      ...parts.filter(
        (part) =>
          !part ||
          typeof part !== 'object' ||
          (part as { type?: unknown }).type !== 'text',
      ),
      { type: 'text', text: safeText },
    ],
  };
}
