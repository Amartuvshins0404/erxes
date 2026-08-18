import { type ReactNode } from 'react';
import {
  useMessageRuntime,
  type TextMessagePart,
  type ToolCallMessagePart,
} from '@assistant-ui/react';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
} from '@tabler/icons-react';
import { ThinkingOrb } from 'thinking-orbs';
import {
  humanizeToolName,
  isFailureResult,
  isRecord,
} from '~/modules/chat/assistant/toolValue';
import {
  buildTurnSteps,
  type TurnActivityItem,
} from '~/modules/chat/assistant/turnSteps';
import { previewStore } from '~/modules/chat/preview/previewStore';

const settledLabel = (parts: ToolCallMessagePart[]): ReactNode => {
  const count = parts.length;
  const names = [...new Set(parts.map((part) => part.toolName))];
  if (names.length === 1) {
    const [name] = names;
    if (name === 'webSearch') {
      return count === 1 ? 'Searched the web' : `Ran ${count} searches`;
    }
    if (name === 'fetchUrl') {
      return count === 1 ? 'Fetched a page' : `Fetched ${count} pages`;
    }
    if (name === 'runCode' || name === 'run-code') {
      return count === 1 ? 'Ran code' : `Ran code ×${count}`;
    }
    return (
      <>
        Used <b className="font-medium">{humanizeToolName(name ?? 'tool')}</b>
        {count > 1 ? ` ×${count}` : ''}
      </>
    );
  }
  return `Used ${count} tools`;
};

// Plain-string twin of settledLabel — the activity panel's title basis.
const settledTitle = (parts: ToolCallMessagePart[]): string => {
  const count = parts.length;
  const names = [...new Set(parts.map((part) => part.toolName))];
  if (names.length === 1) {
    const [name] = names;
    if (name === 'webSearch') {
      return count === 1 ? 'Searched the web' : `Ran ${count} searches`;
    }
    if (name === 'fetchUrl') {
      return count === 1 ? 'Fetched a page' : `Fetched ${count} pages`;
    }
    if (name === 'runCode' || name === 'run-code') {
      return count === 1 ? 'Ran code' : `Ran code ×${count}`;
    }
    return `Used ${humanizeToolName(name ?? 'tool')}${
      count > 1 ? ` ×${count}` : ''
    }`;
  }
  return `Used ${count} tools`;
};

// All reasoning bursts and tool calls of a turn render behind ONE
// ChatGPT-style process line: while working it shows the current step's real,
// content-derived title (a distilled reasoning title or a per-tool label) with
// a thinking orb; settled it shows the summary ("Used 5 tools"). Clicking the
// line opens the right activity panel with the full process as titled steps —
// nothing expands inline and reasoning never renders as message rows.
// assistant-ui's Unstable_PartsGrouped places every activity part of the
// message into this single group — see groupTurnActivity in AgentMessage.
export const ToolGroupBlock = ({ indices }: { indices: number[] }) => {
  const runtime = useMessageRuntime();

  const state = runtime.getState();
  const parts: ToolCallMessagePart[] = [];
  const activities: TurnActivityItem[] = [];
  indices.forEach((index) => {
    const part = state.content[index];
    if (part?.type === 'reasoning') {
      activities.push({ kind: 'reasoning', text: part.text });
      return;
    }
    if (part?.type === 'tool-call') {
      parts.push(part);
      activities.push({
        kind: 'tool',
        call: {
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.args,
          argsText: part.argsText,
          result: part.result,
          isError: part.isError,
        },
      });
    }
  });
  if (!activities.length) return null;

  const streaming =
    state.status?.type === 'running' ||
    parts.some((part) => part.result === undefined);
  const failed = parts.some(
    (part) => part.isError || isFailureResult(part.result),
  );
  const hasText = state.content
    .filter((p): p is TextMessagePart => p?.type === 'text')
    .some((p) => !!p.text.trim());
  const lastPart = parts[parts.length - 1];
  const awaitingUserAnswer =
    lastPart?.toolName === 'ask_user' &&
    isRecord(lastPart.result) &&
    lastPart.result.awaitingUserAnswer === true;

  const steps = buildTurnSteps({
    activities,
    streaming,
    hasText,
    awaitingUserAnswer,
  });
  const activeStep = steps.find((step) => step.status === 'active');
  const working = !!activeStep;

  const statusIcon = working ? (
    <ThinkingOrb state={activeStep.runningState ?? 'working'} size={20} />
  ) : failed ? (
    <IconAlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
  ) : (
    <IconCheck className="size-4 shrink-0" />
  );
  const label = (
    <span
      className={`min-w-0 break-words leading-5 ${
        working ? 'ea-shimmer-text' : ''
      }`}
    >
      {working
        ? activeStep.label
        : parts.length > 0
          ? settledLabel(parts)
          : 'Thought process'}
    </span>
  );
  const lineClass =
    'flex w-fit max-w-full items-center gap-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground';

  // The line opens the right activity panel with the full process.
  return (
    <button
      type="button"
      className={lineClass}
      onClick={() =>
        previewStore.getState().openActivity({
          steps,
          title: working
            ? 'Working…'
            : parts.length > 0
              ? settledTitle(parts)
              : 'Thought process',
        })
      }
    >
      {statusIcon}
      {label}
      <IconChevronDown className="size-4 shrink-0 -rotate-90" />
    </button>
  );
};
