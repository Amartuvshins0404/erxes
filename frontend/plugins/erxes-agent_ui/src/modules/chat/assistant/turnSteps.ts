import type { OrbState } from 'thinking-orbs';
import { humanizeToolName } from '~/modules/chat/assistant/toolValue';
import type { PanelToolCall } from '~/modules/chat/preview/previewStore';

// Pure model behind the turn activity line/panel: a ChatGPT/Claude-style list
// of process steps (analyze → one step per reasoning burst or tool call →
// compose) with descriptive labels and pending/active/done states. Each step
// carries the tool calls it scopes to (reasoning/phase steps carry none) plus
// an optional note (the FULL reasoning text) so the preview panel can render
// the whole process as titled steps.

export interface TurnStep {
  id: string;
  status: 'done' | 'active' | 'pending';
  label: string;
  hint?: string;
  toolCalls: PanelToolCall[];
  note?: string;
  runningState?: OrbState;
}

// One ordered item of turn work — a reasoning burst or a tool call — in the
// exact order the message parts produced them.
export type TurnActivityItem =
  | { kind: 'reasoning'; text: string }
  | { kind: 'tool'; call: PanelToolCall };

// Args arrive as unknown — narrow before reading, never crash on missing args.
const argString = (args: unknown, key: string): string => {
  if (typeof args === 'object' && args !== null && key in args) {
    const value = (args as Record<string, unknown>)[key];
    return value === undefined || value === null ? '' : String(value);
  }
  return '';
};

// The first meaningful code line, capped — the running hint for runCode.
const codeHint = (code: string): string => {
  const line = code
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith('//'));
  if (!line) return '';
  return line.length > 60 ? `${line.slice(0, 60)}…` : line;
};

const hostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

// "mcp:github:list-issues" / "tool-run-code" → humanized base name.
const baseToolName = (name: string): string => {
  const cut = Math.max(name.lastIndexOf(':'), name.lastIndexOf('-'));
  return humanizeToolName(cut >= 0 ? name.slice(cut + 1) : name);
};

interface StepCopy {
  active: string;
  settled: string;
  hint?: string;
  runningState: OrbState;
}

// Per-tool phrasing for the stepper — present-tense while running, past-tense
// once settled, plus the thinking-orb state for the active step.
const stepCopy = (call: PanelToolCall): StepCopy => {
  const { toolName, args } = call;
  switch (toolName) {
    case 'search_tools': {
      const query = argString(args, 'query');
      return {
        active: 'Checking what I can do in the system…',
        settled: 'Checked what I can do in the system',
        hint: query || undefined,
        runningState: 'searching',
      };
    }
    case 'runCode':
    case 'run-code': {
      const hint = codeHint(argString(args, 'code'));
      return {
        active: 'Running code',
        settled: 'Ran code',
        hint: hint || undefined,
        runningState: 'solving',
      };
    }
    case 'webSearch': {
      const query = argString(args, 'query');
      return {
        active: 'Searching the web',
        settled: 'Searched the web',
        hint: query ? `“${query}”` : undefined,
        runningState: 'searching',
      };
    }
    case 'fetchUrl': {
      const url = argString(args, 'url');
      const host = url ? hostname(url) : '';
      return {
        active: host ? `Fetching ${host}` : 'Fetching',
        settled: host ? `Fetched ${host}` : 'Fetched',
        runningState: 'connecting',
      };
    }
    case 'calculator':
      return {
        active: 'Calculating',
        settled: 'Calculated',
        runningState: 'solving',
      };
    case 'renderChart':
      return {
        active: 'Building the chart',
        settled: 'Built the chart',
        runningState: 'shaping',
      };
    case 'renderDiagram':
      return {
        active: 'Drawing the diagram',
        settled: 'Drew the diagram',
        runningState: 'shaping',
      };
    case 'generatePdf':
      return {
        active: 'Creating the PDF',
        settled: 'Created the PDF',
        runningState: 'composing',
      };
    case 'generateDocx':
      return {
        active: 'Creating the document',
        settled: 'Created the document',
        runningState: 'composing',
      };
    case 'generateXlsx':
      return {
        active: 'Creating the spreadsheet',
        settled: 'Created the spreadsheet',
        runningState: 'composing',
      };
    case 'generatePptx':
      return {
        active: 'Creating the presentation',
        settled: 'Created the presentation',
        runningState: 'composing',
      };
    case 'removeImageBackground':
      return {
        active: 'Removing the background',
        settled: 'Removed the background',
        runningState: 'shaping',
      };
    case 'request_approval':
      return {
        active: 'Waiting for your approval',
        settled: 'Approval handled',
        runningState: 'listening',
      };
    case 'ask_user':
      return {
        active: 'Preparing a question',
        settled: 'Asked a question',
        runningState: 'listening',
      };
    default: {
      const name = baseToolName(toolName);
      return {
        active: `Using ${name}`,
        settled: `Used ${name}`,
        runningState: 'working',
      };
    }
  }
};

interface DraftStep {
  id: string;
  activeLabel: string;
  settledLabel: string;
  done: boolean;
  hint?: string;
  toolCalls: PanelToolCall[];
  note?: string;
  runningState?: OrbState;
}

// A reasoning step's title is distilled from its own text: the first non-empty
// line, leading markdown markers (#, *, -, >, spaces) stripped, capped at 80
// chars. Empty bursts fall back to the generic name.
const reasoningTitle = (text: string): string => {
  const line = text
    .split('\n')
    .map((l) => l.replace(/^[#*>\s-]+/, '').trim())
    .find((l) => l.length > 0);
  if (!line) return 'Thought process';
  return line.length > 80 ? `${line.slice(0, 80)}…` : line;
};

// Statuses are positional: the FIRST not-done step is active, everything
// before it done, everything after it pending. Phase steps obey the same rule
// (analyze-request is active only while nothing later is).
export const buildTurnSteps = (input: {
  activities: TurnActivityItem[];
  streaming: boolean;
  hasText: boolean;
  awaitingUserAnswer: boolean;
}): TurnStep[] => {
  const { activities, streaming, hasText, awaitingUserAnswer } = input;

  const drafts: DraftStep[] = [
    {
      id: 'analyze-request',
      activeLabel: 'Analyzing the request…',
      settledLabel: 'Analyzed the request',
      done: activities.length > 0 || hasText,
      note: 'The agent read your message and planned its approach.',
      toolCalls: [],
    },
  ];

  activities.forEach((item, index) => {
    if (item.kind === 'reasoning') {
      // A reasoning burst has no result field — approximate settlement: done
      // once a LATER activity exists (its text is no longer the live edge) or
      // the turn itself settled; the live burst is the active step and lends
      // the process line its distilled title.
      drafts.push({
        id: `reasoning-${index}`,
        activeLabel: reasoningTitle(item.text),
        settledLabel: reasoningTitle(item.text),
        done: index < activities.length - 1 || !streaming,
        note: item.text,
        toolCalls: [],
        runningState: 'working',
      });
      return;
    }
    const copy = stepCopy(item.call);
    drafts.push({
      id: item.call.toolCallId || `tool-call-${index}`,
      activeLabel: copy.active,
      settledLabel: copy.settled,
      done: item.call.result !== undefined,
      hint: copy.hint,
      toolCalls: [item.call],
      runningState: copy.runningState,
    });
  });

  if (activities.length > 0) {
    drafts.push({
      id: 'compose-answer',
      activeLabel: awaitingUserAnswer
        ? 'Waiting for your answer'
        : 'Analyzing the results…',
      settledLabel: 'Composed the answer',
      done: !awaitingUserAnswer && !(streaming && !hasText),
      note: 'The agent wrote its reply from the step results.',
      toolCalls: [],
      runningState: awaitingUserAnswer ? 'listening' : 'composing',
    });
  }

  const activeIndex = drafts.findIndex((draft) => !draft.done);

  return drafts.map((draft, index) => {
    const status: TurnStep['status'] =
      activeIndex === -1 || index < activeIndex
        ? 'done'
        : index === activeIndex
          ? 'active'
          : 'pending';
    return {
      id: draft.id,
      status,
      label: status === 'done' ? draft.settledLabel : draft.activeLabel,
      hint: draft.hint,
      toolCalls: draft.toolCalls,
      note: draft.note,
      runningState: draft.runningState,
    };
  });
};
