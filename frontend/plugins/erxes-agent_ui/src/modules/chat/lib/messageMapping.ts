import {
  AgentUIMessage,
  DbNativePart,
  DbThreadMessage,
  DbToolCall,
} from '~/modules/chat/types';

// History hydration: rebuild user-facing AI SDK parts from a persisted assistant
// message. Native text and tool parts are the source of truth. The legacy meta
// path remains for tool output needed by approvals and artifacts.

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
    return {
      ...base,
      state: 'output-available',
      input: call.args,
      output: call.result,
    };
  }
  return { ...base, state: 'input-available', input: call.args };
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

// Hydrate native text and tool output. Internal reasoning parts never reach the
// end-user chat.
const nativeAssistantParts = (m: DbThreadMessage): MessagePart[] => {
  const parts: MessagePart[] = [];
  (m.parts ?? []).forEach((part, i) => {
    if (part.type === 'text') {
      const text = (part as Extract<DbNativePart, { type: 'text' }>).text;
      if (text) parts.push({ type: 'text', text, state: 'done' });
    } else if (part.type === 'tool-invocation') {
      const call = toolCallFromNative(part);
      if (call) parts.push(toToolPart(call, `${m._id}-tool-${i}`));
    }
  });
  return parts;
};

// Fallback for rows saved before native parts were exposed. Only legacy tool
// output still serves the user-facing chat.
const legacyToolCalls = (meta: DbThreadMessage['meta']): DbToolCall[] => {
  if (!meta) return [];
  const ordered = (meta.parts ?? [])
    .filter((part) => part.kind === 'tool' && part.call)
    .map((part) => part.call as DbToolCall);
  return ordered.length ? ordered : meta.toolCalls ?? [];
};

const metaAssistantParts = (m: DbThreadMessage): MessagePart[] => {
  const parts = legacyToolCalls(m.meta).map((call, i) =>
    toToolPart(call, `${m._id}-tool-${i}`),
  );
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
