import { IconChevronDown } from '@tabler/icons-react';
import {
  isDataUIPart,
  isReasoningUIPart,
  isTextUIPart,
  isToolUIPart,
} from 'ai';
import type { UIMessage } from 'ai';
import { Collapsible } from 'erxes-ui';
import { useState } from 'react';

import { ApprovalPrompt } from './ApprovalPrompt';
import { AskUserPrompt, type IAskUserQuestion } from './AskUserPrompt';
import { Markdown } from './Markdown';
import type { IToolCallView } from './ToolCallCard';

type MessagePart = UIMessage['parts'][number];

const ReasoningPart = ({ text }: { text: string }) => {
  const [open, setOpen] = useState(false);

  if (!text) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconChevronDown
            className={`size-3.5 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
          {open ? 'Hide reasoning' : 'Show reasoning'}
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-dashed bg-muted/30 p-2.5 text-[13px] text-muted-foreground">
          {text}
        </p>
      </Collapsible.Content>
    </Collapsible>
  );
};

export interface IMessagePartRendererProps {
  part: MessagePart;
  role: UIMessage['role'];
  /** True while the approval decision is being submitted. */
  approvalBusy: boolean;
  onApprovalRespond: (decision: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => void;
  /** True while an ask_user answer is being submitted. */
  answerBusy: boolean;
  onAnswer: (answer: string | string[]) => void;
}

/**
 * Extracts the ask_user question from a `data-tool-call-suspended` data part
 * emitted by the backend when the ask_user tool suspends. Returns null for
 * every other suspension or a malformed payload.
 */
const readAskUserQuestion = (part: MessagePart): IAskUserQuestion | null => {
  if (!isDataUIPart(part)) {
    return null;
  }

  const typed = part as { type: string; data?: unknown };

  if (typed.type !== 'data-tool-call-suspended') {
    return null;
  }

  const data = typed.data as {
    toolName?: string;
    suspendPayload?: unknown;
  } | null;

  if (data?.toolName !== 'askUser') {
    return null;
  }

  const payload = data.suspendPayload as Partial<IAskUserQuestion> | null;

  if (!payload || typeof payload.question !== 'string' || !payload.question) {
    return null;
  }

  const options = Array.isArray(payload.options)
    ? payload.options.filter(
        (option): option is { label: string; description?: string } =>
          typeof option === 'object' &&
          option !== null &&
          typeof option.label === 'string',
      )
    : undefined;

  return {
    question: payload.question,
    ...(options?.length ? { options } : {}),
    ...(payload.selectionMode === 'multi_select'
      ? { selectionMode: 'multi_select' as const }
      : {}),
  };
};

/**
 * Renders one UIMessage part according to its type. Tool parts surface only
 * the destructive-action approval prompt; data parts surface the ask_user
 * question; all other tool states stay hidden in the transcript.
 */
export const MessagePartRenderer = ({
  part,
  role,
  approvalBusy,
  onApprovalRespond,
  answerBusy,
  onAnswer,
}: IMessagePartRendererProps) => {
  if (isTextUIPart(part)) {
    if (role === 'user') {
      return (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed md:text-[17px] md:leading-7">
          {part.text}
        </p>
      );
    }

    return <Markdown content={part.text} />;
  }

  if (isReasoningUIPart(part)) {
    return <ReasoningPart text={part.text} />;
  }

  if (isToolUIPart(part)) {
    if (part.state !== 'approval-requested') {
      return null;
    }

    const tool: IToolCallView = {
      toolCallId: part.toolCallId,
      toolName: 'toolName' in part ? part.toolName : part.type.slice('tool-'.length),
      state: part.state,
      input: part.input,
      output: 'output' in part ? part.output : undefined,
      errorText: 'errorText' in part ? part.errorText : undefined,
      approval: part.approval,
    };

    return (
      <ApprovalPrompt
        tool={tool}
        busy={approvalBusy}
        onRespond={({ approved, reason }) =>
          onApprovalRespond({
            approvalId: part.approval.id,
            approved,
            reason,
          })
        }
      />
    );
  }

  // Data parts: the ask_user suspension carries the question the assistant
  // asked; approval suspensions' metadata is already surfaced by the tool
  // part above. Everything else stays hidden.
  if (isDataUIPart(part)) {
    const question = readAskUserQuestion(part);

    if (!question) {
      return null;
    }

    return (
      <AskUserPrompt question={question} busy={answerBusy} onAnswer={onAnswer} />
    );
  }

  return null;
};
