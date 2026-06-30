import {
  AgentUIMessage,
  ApprovedOp,
  asApprovalRequest,
} from '~/modules/chat/types';

// Helpers for reading AI SDK UIMessage parts in the chat UI. Mastra streams tool
// invocations as `tool-<name>` parts for statically-known tools and `dynamic-tool`
// parts for runtime-registered ones (which is what the erxes tools are); both
// carry the same state machine, so this normalizes either into one view.

type MessagePart = AgentUIMessage['parts'][number];

export type ToolPartState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error';

// One tool invocation flattened for rendering, regardless of the part variant.
export interface ToolPartView {
  toolCallId?: string;
  toolName: string;
  state: ToolPartState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  isError: boolean;
  // The result has not landed yet — drives the running spinner.
  pending: boolean;
}

const isToolType = (type: string): boolean =>
  type === 'dynamic-tool' || type.startsWith('tool-');

/** Narrow a UIMessage part to a normalized tool view, or null when it is not a
 *  tool part. The field reads are defensive (every field optional, state
 *  defaulted) so a contract drift renders blank rather than crashing. */
export const asToolPart = (part: MessagePart): ToolPartView | null => {
  if (!isToolType(part.type)) return null;
  const p = part as MessagePart & {
    type: string;
    toolName?: string;
    toolCallId?: string;
    state?: ToolPartState;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
  const toolName =
    p.type === 'dynamic-tool' ? (p.toolName ?? '') : p.type.slice('tool-'.length);
  const state: ToolPartState = p.state ?? 'input-available';
  return {
    toolCallId: p.toolCallId,
    toolName,
    state,
    input: p.input,
    output: p.output,
    errorText: p.errorText,
    isError: state === 'output-error',
    pending: state === 'input-streaming' || state === 'input-available',
  };
};

// The meaningful summary arg per tool, keyed by tool name (ids mirror the
// backend mastra/tools registry). This is the explicit contract: each tool names
// the input field that summarizes the call, so the hint is never a guess about
// which key happens to surface first. A tool not listed here falls through to the
// last-resort generic scan below.
const TOOL_HINT_KEYS: Record<string, readonly string[]> = {
  'web-search': ['query'],
  'fetch-url': ['url'],
  calculator: ['expression'],
  'render-chart': ['title'],
  'render-diagram': ['title'],
  'generate-pdf': ['title'],
  'generate-docx': ['title'],
  'generate-pptx': ['title'],
  'generate-xlsx': ['title'],
  'company-knowledge': ['query'],
  'read-attachment': ['fileName', 'name'],
  readAttachment: ['fileName', 'name'],
  search_erxes_operations: ['query'],
  execute_erxes_operation: ['operation'],
  lookup: ['query'],
  classify: ['query'],
};

// Last-resort key order for tools with no explicit entry. Intentionally narrow
// and ends without `id`, so an internal id is never shown as a summary.
const FALLBACK_HINT_KEYS = ['url', 'href', 'query', 'q', 'search', 'title', 'name'] as const;

const readHint = (
  obj: Record<string, unknown>,
  keys: readonly string[],
): string => {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return cleanHint(v);
  }
  return '';
};

/** A short, human hint for a tool call — the URL it fetched, the query it ran —
 *  shown dimmed next to the tool name in the run timeline so a row reads as
 *  "fetchUrl  docs.erxes.io/…" rather than a bare name. Each tool declares its
 *  summary arg in TOOL_HINT_KEYS; unmapped tools fall back to a narrow generic
 *  scan. Defensive: unknown shapes return '' so the row simply omits the hint. */
export const toolHint = (input: unknown, toolName?: string): string => {
  if (typeof input === 'string') return cleanHint(input);
  if (!input || typeof input !== 'object') return '';
  const obj = input as Record<string, unknown>;
  const explicit = toolName ? TOOL_HINT_KEYS[toolName] : undefined;
  if (explicit) {
    const hit = readHint(obj, explicit);
    if (hit) return hit;
  }
  return readHint(obj, FALLBACK_HINT_KEYS);
};

// Drop the scheme + leading www. from URLs and collapse whitespace so the hint
// stays compact; truncation to a single line is the row's job (CSS).
const cleanHint = (raw: string): string =>
  raw.trim().replace(/^https?:\/\/(www\.)?/i, '').replace(/\s+/g, ' ');

/** The concatenated assistant answer text across a message's text parts. */
export const messageText = (message: AgentUIMessage): string =>
  message.parts
    .filter((p): p is MessagePart & { type: 'text'; text: string } =>
      p.type === 'text',
    )
    .map((p) => p.text)
    .join('');

// The model often narrates its whole turn before the confirmation; keep only the
// last couple of sentences so the approval bar stays short.
const lastSentences = (text: string, max = 2): string => {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t
    .split(/(?<=[.?!])\s+/)
    .slice(-max)
    .join(' ');
};

/**
 * A settled assistant turn that ended on one or more destructive ops awaiting the
 * user's go-ahead. Returns the model's confirmation question + the exact ops to
 * replay on approval, or null when nothing is pending. Derived from the last
 * message so it clears automatically once the next turn runs.
 */
export const pendingApproval = (
  messages: AgentUIMessage[],
  streaming: boolean,
): { prompt: string; operations: ApprovedOp[] } | null => {
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'assistant' || streaming) return null;

  let summary: string | undefined;
  const operations: ApprovedOp[] = [];
  for (const part of last.parts) {
    const tool = asToolPart(part);
    if (!tool) continue;
    const req = asApprovalRequest(tool.output);
    if (req) {
      // Prefer the model's dedicated request_approval summary.
      if (req.summary && !summary) summary = req.summary;
      operations.push(...req.operations);
    }
  }
  if (!operations.length) return null;

  return {
    // request_approval summary first; otherwise the last sentences of the reply.
    prompt: summary || lastSentences(messageText(last)) || 'Confirm this action?',
    operations,
  };
};
