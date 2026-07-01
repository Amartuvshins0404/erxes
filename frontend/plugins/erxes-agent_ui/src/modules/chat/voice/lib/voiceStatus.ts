import { cleanForSpeech } from './sentences';
import type { VoicePhase } from '~/modules/chat/voice/hooks/useVoiceConversation';

// Pure mapping from the voice turn's live signals to what the overlay shows
// while the user waits: a short Mongolian status label plus an optional detail
// subtitle (the agent's concrete activity while it works, or the streamed reply
// read-along while it speaks). Kept React-free so the wait-window copy is unit
// testable without rendering the overlay.

export interface VoiceStatusView {
  // The headline status line (Mongolian primary). Always present.
  label: string;
  // A secondary line under it: the server's concrete activity while thinking, or
  // the streaming reply tail while speaking. Absent when there is nothing to add.
  detail?: string;
}

// Friendly present-continuous label for an in-flight tool call, by tool name.
// Mongolian primary, matching the calm one-line voice copy. Names mirror the
// agent's registered tools (see backend mastra/tools + activity-signals.ts);
// anything unmapped falls back to a generic "using a tool" line.
const TOOL_LABELS: Record<string, string> = {
  search_erxes_operations: 'Хайж байна…',
  execute_erxes_operation: 'Ажиллуулж байна…',
  'company-knowledge': 'Мэдээлэл хайж байна…',
  'web-search': 'Вэбээс хайж байна…',
  'fetch-url': 'Холбоос уншиж байна…',
  calculator: 'Тооцоолж байна…',
  'render-chart': 'График зурж байна…',
  'read-attachment': 'Файл уншиж байна…',
  readAttachment: 'Файл уншиж байна…',
  'generate-pdf': 'Баримт бэлдэж байна…',
  'generate-docx': 'Баримт бэлдэж байна…',
  'generate-xlsx': 'Хүснэгт бэлдэж байна…',
  request_approval: 'Зөвшөөрөл хүсэж байна…',
  lookup: 'Хайж байна…',
  classify: 'Ангилж байна…',
};

const GENERIC_TOOL_LABEL = 'Багаж ашиглаж байна…';

const PHASE_LABELS: Record<VoicePhase, string> = {
  idle: 'Микрофоныг дараад яриагаа эхлүүлээрэй',
  listening: 'Сонсож байна…',
  transcribing: 'Бичиж байна…',
  thinking: 'Бодож байна…',
  speaking: 'Хариулж байна…',
  error: 'Алдаа гарлаа',
};

/** Mongolian label for a tool call. Workflow tools share one umbrella line. */
export function toolStatusLabel(toolName: string): string {
  if (TOOL_LABELS[toolName]) return TOOL_LABELS[toolName];
  if (toolName.startsWith('workflow')) return 'Урсгал боловсруулж байна…';
  return GENERIC_TOOL_LABEL;
}

/**
 * The trailing slice of the streamed reply, markdown-stripped, for the speaking
 * read-along subtitle. Capped to `max` chars from the end and re-aligned to the
 * next word boundary so the line never starts mid-word.
 */
export function partialTail(text: string, max = 160): string {
  const clean = cleanForSpeech(text);
  if (clean.length <= max) return clean;
  const tail = clean.slice(-max);
  const space = tail.search(/\s/);
  return (space >= 0 ? tail.slice(space + 1) : tail).trim();
}

export interface VoiceStatusInput {
  phase: VoicePhase;
  error?: string;
  // Name of the tool whose call is currently in flight (no result yet), if any.
  activeToolName?: string;
  // The server-pushed activity line for the working thread (concrete, English).
  serverActivity?: string;
  // The assistant reply text streamed so far (for the speaking read-along).
  partialText?: string;
}

/**
 * Fold the live turn signals into the overlay's status view. A pure function of
 * its inputs so identical signals always yield identical copy.
 */
export function deriveVoiceStatus(input: VoiceStatusInput): VoiceStatusView {
  const { phase, error, activeToolName, serverActivity, partialText } = input;

  if (phase === 'error') {
    return { label: error?.trim() || PHASE_LABELS.error };
  }

  if (phase === 'speaking') {
    const tail = partialTail(partialText ?? '');
    return { label: PHASE_LABELS.speaking, detail: tail || undefined };
  }

  if (phase === 'thinking') {
    // A tool call wins the label and shows the server's concrete subject. With
    // no tool running, the reply may already be streaming in — read it back live
    // so the wait shows progress; fall back to the server activity line.
    if (activeToolName) {
      return {
        label: toolStatusLabel(activeToolName),
        detail: serverActivity?.trim() || undefined,
      };
    }
    const tail = partialTail(partialText ?? '');
    return {
      label: PHASE_LABELS.thinking,
      detail: tail || serverActivity?.trim() || undefined,
    };
  }

  return { label: PHASE_LABELS[phase] };
}
