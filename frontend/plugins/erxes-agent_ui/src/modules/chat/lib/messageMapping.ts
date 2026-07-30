import {
  AgentUIMessage,
  DbNativePart,
  DbThreadMessage,
  DbToolCall,
  DbTurnPart,
} from '~/modules/chat/types';

// History hydration: rebuild AI SDK UIMessage parts from a persisted assistant
// message. The source of truth is Mastra's NATIVE `content.parts`
// (reasoning / text / tool-invocation, in order) — persisted by construction on
// the correct row. The legacy `meta`-based path remains only as a fallback for
// rows saved before the resolver surfaced native parts. The reverse direction —
// UIMessage chunks → persisted meta — lives in the backend turn pipeline.

type MessagePart = AgentUIMessage['parts'][number];

// A `dynamic-tool` error part needs a string errorText, so stringify a
// non-string persisted result rather than dropping its detail.
const errorTextOf = (result: unknown): string => {
  if (typeof result === 'string') return result;
  try {
    return JSON.stringify(result) || 'Tool failed';
  } catch {
    return 'Tool failed';
  }
};

// One persisted tool call → a `dynamic-tool` UIMessage part (the erxes tools are
// runtime-registered, so they render via the dynamic-tool variant). The part is
// built per-state so it satisfies the discriminated union.
const toToolPart = (call: DbToolCall, fallbackId: string): MessagePart => {
  const toolCallId = call.toolCallId || fallbackId;
  const base = {
    type: 'dynamic-tool' as const,
    toolName: call.toolName,
    toolCallId,
  };
  if (call.isError) {
    return {
      ...base,
      state: 'output-error',
      input: call.args,
      errorText: errorTextOf(call.result),
    };
  }
  if (call.result !== undefined) {
    return { ...base, state: 'output-available', input: call.args, output: call.result };
  }
  return { ...base, state: 'input-available', input: call.args };
};

// Reasoning text for a native part: prefer the flat `reasoning`/`text`, else
// join the `details` text segments (the shape Mastra persists).
const nativeReasoningText = (part: DbNativePart): string => {
  const p = part as Extract<DbNativePart, { type: 'reasoning' }>;
  if (p.reasoning?.trim()) return p.reasoning;
  const fromDetails = (p.details ?? [])
    .filter((d) => d.type === 'text')
    .map((d) => d.text ?? '')
    .join('');
  return fromDetails || p.text || '';
};

// A native tool-invocation part → the DbToolCall shape `toToolPart` renders.
const toolCallFromNative = (part: DbNativePart): DbToolCall | null => {
  const ti = (part as Extract<DbNativePart, { type: 'tool-invocation' }>)
    .toolInvocation;
  if (!ti?.toolName) return null;
  const isError = ti.state === 'output-error';
  return {
    toolCallId: ti.toolCallId,
    toolName: ti.toolName,
    args: ti.args,
    result: isError ? ti.errorText : ti.result,
    isError,
  };
};

// Hydrate from Mastra's native `content.parts` (the source of truth): reasoning →
// reasoning, tool-invocation → dynamic-tool, text → text, in stored order. Other
// part types (e.g. `step-start`) are dropped.
const nativeAssistantParts = (m: DbThreadMessage): MessagePart[] => {
  const parts: MessagePart[] = [];
  (m.parts ?? []).forEach((part, i) => {
    if (part.type === 'reasoning') {
      const text = nativeReasoningText(part);
      if (text) parts.push({ type: 'reasoning', text, state: 'done' });
    } else if (part.type === 'text') {
      const text = (part as Extract<DbNativePart, { type: 'text' }>).text;
      if (text) parts.push({ type: 'text', text, state: 'done' });
    } else if (part.type === 'tool-invocation') {
      const call = toolCallFromNative(part);
      if (call) parts.push(toToolPart(call, `${m._id}-tool-${i}`));
    }
  });
  return parts;
};

// Fallback for rows persisted before native parts were surfaced: rebuild from the
// legacy `meta` (ordered `parts`, or the flat thinking/toolCalls aggregates).
const turnParts = (meta: DbThreadMessage['meta']): DbTurnPart[] => {
  if (!meta) return [];
  if (Array.isArray(meta.parts) && meta.parts.length) {
    return meta.parts.map((p) =>
      p.kind === 'tool'
        ? { kind: 'tool' as const, call: p.call ?? { toolName: '' } }
        : { kind: 'thinking' as const, text: p.text ?? '' },
    );
  }
  const parts: DbTurnPart[] = [];
  if (meta.thinking) parts.push({ kind: 'thinking', text: meta.thinking });
  for (const call of meta.toolCalls ?? []) parts.push({ kind: 'tool', call });
  return parts;
};

const metaAssistantParts = (m: DbThreadMessage): MessagePart[] => {
  const parts: MessagePart[] = [];
  turnParts(m.meta).forEach((part, i) => {
    if (part.kind === 'thinking') {
      parts.push({ type: 'reasoning', text: part.text, state: 'done' });
    } else {
      parts.push(toToolPart(part.call, `${m._id}-tool-${i}`));
    }
  });
  if (m.content) parts.push({ type: 'text', text: m.content, state: 'done' });
  return parts;
};

// Prefer native parts; fall back to meta only for rows that predate them.
const assistantParts = (m: DbThreadMessage): MessagePart[] =>
  m.parts?.length ? nativeAssistantParts(m) : metaAssistantParts(m);

/** Convert persisted thread messages into seed UIMessages for a `Chat`. */
export const metaToUIMessages = (
  messages: DbThreadMessage[],
): AgentUIMessage[] =>
  messages.map((m) => {
    if (m.role === 'user') {
      return {
        id: m._id,
        role: 'user',
        parts: m.content ? [{ type: 'text', text: m.content }] : [],
        metadata: {
          messageId: m._id,
          createdAt: m.createdAt,
          attachments: m.attachments?.length ? m.attachments : undefined,
        },
      };
    }
    return {
      id: m._id,
      role: 'assistant',
      parts: assistantParts(m),
      metadata: {
        messageId: m._id,
        createdAt: m.createdAt,
        interrupted: m.meta?.interrupted || undefined,
      },
    };
  });
