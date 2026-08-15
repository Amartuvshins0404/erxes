import { useRef, useState, type ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import {
  useMessageRuntime,
  useScrollLock,
  type TextMessagePart,
  type ToolCallMessagePart,
} from '@assistant-ui/react';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconCircle,
} from '@tabler/icons-react';
import { ThinkingOrb } from 'thinking-orbs';
import { Collapsible } from 'erxes-ui';
import {
  humanizeToolName,
  isFailureResult,
  isRecord,
} from '~/modules/chat/assistant/toolValue';
import {
  buildTurnSteps,
  type TurnActivityItem,
  type TurnStep,
} from '~/modules/chat/assistant/turnSteps';
import { chatDebugModeAtom } from '~/modules/chat/debugMode';
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

// One process step in the debug-mode inline stepper: status icon (+ connector
// line to the next step), label, and an optional hint. Clicking opens the
// preview panel scoped to just that step.
const StepRow = ({ step, last }: { step: TurnStep; last: boolean }) => (
  <button
    type="button"
    className="flex w-full items-center gap-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
    onClick={() =>
      previewStore.getState().openActivity({
        steps: [step],
        title: step.label,
      })
    }
  >
    <div className="flex w-5 shrink-0 flex-col items-center self-stretch">
      {step.status === 'done' ? (
        <IconCheck className="size-4 shrink-0 text-muted-foreground" />
      ) : step.status === 'active' ? (
        <ThinkingOrb state={step.runningState ?? 'working'} size={20} />
      ) : (
        <IconCircle className="size-4 shrink-0 opacity-50" />
      )}
      {!last && <div className="mt-0.5 w-px flex-1 border-l border-border" />}
    </div>
    <span
      className={`min-w-0 break-words leading-5 ${
        step.status === 'active' ? 'ea-shimmer-text' : ''
      } ${step.status === 'pending' ? 'opacity-60' : ''}`}
    >
      {step.label}
    </span>
    {step.hint && <span className="ea-muted-80 truncate">{step.hint}</span>}
  </button>
);

// All reasoning bursts and tool calls of a turn render behind ONE
// ChatGPT-style process line: while working it shows the current step's real,
// content-derived title (a distilled reasoning title or a per-tool label) with
// a thinking orb; settled it shows the summary ("Used 5 tools"). Clicking the
// line opens the right activity panel with the full process as titled steps —
// nothing expands inline and reasoning never renders as message rows.
// assistant-ui's Unstable_PartsGrouped places every activity part of the
// message into this single group — see groupTurnActivity in AgentMessage.
// Debug mode swaps the panel-open click for the inline stepper (force-expanded).
export const ToolGroupBlock = ({ indices }: { indices: number[] }) => {
  const [open, setOpen] = useState(false);
  const debugMode = useAtomValue(chatDebugModeAtom);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockScroll = useScrollLock(rootRef, 200);
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

  // Default: the line opens the right activity panel with the full process.
  if (!debugMode) {
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
  }

  // Debug mode: the scroll-locked inline stepper, force-expanded; each row
  // opens the panel scoped to that step.
  return (
    <Collapsible
      ref={rootRef}
      open={open || debugMode}
      onOpenChange={(next) => {
        lockScroll();
        setOpen(next);
      }}
    >
      <Collapsible.Trigger className={lineClass}>
        {statusIcon}
        {label}
        <IconChevronDown className="size-4 shrink-0 transition-transform duration-200" />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <div className="flex flex-col ps-4 pt-1 pb-1">
          {steps.map((step, i) => (
            <StepRow
              key={step.id}
              step={step}
              last={i === steps.length - 1}
            />
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible>
  );
};
