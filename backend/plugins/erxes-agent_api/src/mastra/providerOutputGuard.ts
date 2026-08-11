import type {
  ProcessInputStepArgs,
  ProcessInputStepResult,
  ProcessOutputStepArgs,
  Processor,
} from '@mastra/core/processors';

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

const ACTION_VERB =
  '(?:fetch|pull|research|look up|check|build|create|write|generate|open|run|continue|gather|review|inspect|prepare|update|save|publish|deploy|finish|complete|implement)';
// Present-continuous English: "fetching", "I'm fetching", "I am just fetching…".
// Kimi K3's English replies frequently include the "I'm" prefix and the bare
// form above missed them — leaving the model free to end a turn on a promise.
const ACTION_IN_PROGRESS =
  /^(?:(?:i['’]?m|i am)\s+(?:just\s+)?)?(?:fetching|building|creating|writing|generating|opening|running|continuing|gathering|reviewing|inspecting|preparing|updating|saving|publishing|deploying|finishing|completing|implementing)\b/i;
const DIRECT_ACTION = new RegExp(
  `^(?:(?:let me|i(?: need to| am going to))\\s+${ACTION_VERB}\\b|now,?\\s*i(?:['’]ll| will)\\s+${ACTION_VERB}\\b|i(?:['’]ll| will)\\s+${ACTION_VERB}\\b[^.!?]*\\b(?:now|next|first|then|right away)\\b)`,
  'i',
);
// Mongolian present-continuous: verb in -ж form + auxiliary байна/байгаа/байв.
// Example: "татаж байна" (is pulling), "үзэж байгаа" (is viewing). Without this
// the guard misses Kimi K3's Mongolian "I'm fetching" phrasings, which it
// emits after tool calls return empty — the original stuck-turn symptom on the
// test deployment.
const MONGOLIAN_CONTINUOUS_RE =
  /[а-яөүё]+ж\s+бай(на|гаа|ж|в|гүй)\s*\.?\s*$/i;

/** A reply ending in an immediate promised action is progress, not an answer. */
export function looksLikeIncompleteProgress(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return true;

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  const lastSentence = sentences[sentences.length - 1];
  return (
    ACTION_IN_PROGRESS.test(lastSentence) ||
    DIRECT_ACTION.test(lastSentence) ||
    MONGOLIAN_CONTINUOUS_RE.test(lastSentence)
  );
}

interface IncompleteTurnMetadata {
  finishReason?: string;
}
export interface ProviderStepCompletion {
  text?: string;
  toolCallCount: number;
  finishReason?: string;
}

export function shouldRetryProviderStep(step: ProviderStepCompletion): boolean {
  // Mid-tool state — the model is asking for more tools; no retry needed.
  if (step.finishReason === 'tool-calls') return false;
  // Empty closing text after a step that already called tools is the
  // "tool-results-are-the-answer" shape — let finalizeTurn synthesize the reply
  // instead of forcing another round-trip.
  const sanitized = sanitizeProviderText(step.text ?? '').text;
  if (!sanitized) return false;
  return looksLikeIncompleteProgress(sanitized);
}

/**
 * Reject a Kimi step that narrates future work instead of doing it. Mastra
 * retries the same step with this feedback, preserving completed tool results
 * while removing the rejected assistant response from the model history.
 */
export class ProviderCompletionGuard
  implements Processor<'provider-completion-guard', IncompleteTurnMetadata>
{
  readonly id = 'provider-completion-guard' as const;
  readonly name = 'Provider completion guard';

  constructor(private readonly requireToolOnRetry = true) {}

  processInputStep({
    retryCount,
    messages,
    activeTools,
    state,
  }: ProcessInputStepArgs<IncompleteTurnMetadata>):
    | ProcessInputStepResult
    | undefined {
    state.hasActiveTools = Boolean(activeTools?.length);
    return this.requireToolOnRetry && state.hasActiveTools && retryCount > 0
      ? { messages, toolChoice: 'required' }
      : undefined;
  }

  processOutputStep({
    text,
    toolCalls,
    finishReason,
    retryCount,
    abort,
    messages,
    state,
  }: ProcessOutputStepArgs<IncompleteTurnMetadata>): ProcessOutputStepArgs<IncompleteTurnMetadata>['messages'] {
    if (
      !state.hasActiveTools ||
      !shouldRetryProviderStep({
        text,
        toolCallCount: toolCalls?.length ?? 0,
        finishReason,
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
  const incomplete = !text || looksLikeIncompleteProgress(text);

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
