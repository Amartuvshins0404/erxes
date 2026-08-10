import { cleanForSpeech } from './sentences';
import type { VoicePhase } from '~/modules/chat/voice/hooks/useVoiceConversation';

// Pure mapping from the voice turn's live signals to what the overlay shows
// while the user waits: a short status label plus an optional detail
// subtitle (the agent's concrete activity while it works, or the streamed reply
// read-along while it speaks). Kept React-free so the wait-window copy is unit
// testable without rendering the overlay.

export interface VoiceStatusView {
  // The headline status line. Always present.
  label: string;
  // A secondary line under it: the server's concrete activity while thinking, or
  // the streaming reply tail while speaking. Absent when there is nothing to add.
  detail?: string;
}

// Friendly present-continuous label for an in-flight tool call, by tool name,
// matching the calm one-line voice copy. Names mirror the agent's registered
// tools (see backend mastra/tools + activity-signals.ts); anything unmapped
// falls back to a generic "using a tool" line.
const TOOL_LABELS: Record<string, string> = {
  search_erxes_operations: 'Searching…',
  execute_erxes_operation: 'Running…',
  'company-knowledge': 'Looking up knowledge…',
  'web-search': 'Searching the web…',
  'fetch-url': 'Reading the link…',
  calculator: 'Calculating…',
  'render-chart': 'Drawing a chart…',
  'read-attachment': 'Reading the file…',
  readAttachment: 'Reading the file…',
  'generate-pdf': 'Preparing a document…',
  'generate-docx': 'Preparing a document…',
  'generate-xlsx': 'Preparing a spreadsheet…',
  request_approval: 'Requesting approval…',
  lookup: 'Searching…',
  classify: 'Classifying…',
};

const GENERIC_TOOL_LABEL = 'Using a tool…';

const PHASE_LABELS: Record<VoicePhase, string> = {
  idle: 'Tap the microphone to start talking',
  listening: 'Listening…',
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  speaking: 'Responding…',
  error: 'Something went wrong',
};

/** Label for a tool call. Workflow tools share one umbrella line. */
export function toolStatusLabel(toolName: string): string {
  if (TOOL_LABELS[toolName]) return TOOL_LABELS[toolName];
  if (toolName.startsWith('workflow')) return 'Processing the workflow…';
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
