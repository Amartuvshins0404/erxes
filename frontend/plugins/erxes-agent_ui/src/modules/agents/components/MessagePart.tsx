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
import {
  AskUserPrompt,
  type IAskUserQuestionEntry,
  type IAskUserQuestionGroup,
} from './AskUserPrompt';
import { MessageContent } from '../artifacts/MessageContent';
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
  onAnswer: (answer: string | string[] | (string | string[])[]) => void;
  /** Tool calls already resolved somewhere in the message. */
  answeredToolCallIds: Set<string>;
}

/**
 * Extracts the ask_user questions from a `data-tool-call-suspended` data
 * part emitted by the backend when the ask_user tool suspends. The payload
 * carries a `questions` batch (the plugin's multi-question tool); a legacy
 * single-question payload is normalized into a one-entry group. Returns
 * null for every other suspension or a malformed payload.
 */
const readAskUserQuestions = (
  part: MessagePart,
): IAskUserQuestionGroup | null => {
  if (!isDataUIPart(part)) {
    return null;
  }

  const typed = part as { type: string; data?: unknown };

  if (typed.type !== 'data-tool-call-suspended') {
    return null;
  }

  const data = typed.data as {
    toolName?: string;
    toolCallId?: string;
    suspendPayload?: {
      questions?: unknown;
      question?: unknown;
      options?: unknown;
      selectionMode?: unknown;
    };
  } | null;

  if (data?.toolName !== 'askUser') {
    return null;
  }

  const payload = data.suspendPayload;

  if (!payload) {
    return null;
  }

  const raw = (
    Array.isArray(payload.questions) && payload.questions.length
      ? payload.questions
      : [payload]
  ) as Record<string, unknown>[];

  const questions: IAskUserQuestionEntry[] = [];

  for (const entry of raw) {
    if (typeof entry.question !== 'string' || !entry.question) {
      continue;
    }

    const options = Array.isArray(entry.options)
      ? entry.options.filter(
          (option): option is { label: string; description?: string } =>
            typeof option === 'object' &&
            option !== null &&
            typeof (option as { label?: unknown }).label === 'string',
        )
      : undefined;

    questions.push({
      question: entry.question,
      ...(options?.length ? { options } : {}),
      ...(entry.selectionMode === 'multi_select'
        ? { selectionMode: 'multi_select' as const }
        : {}),
    });
  }

  return questions.length ? { questions } : null;
};

/**
 * Whether an assistant message renders anything at all: text, reasoning, an
 * approval prompt, or an unanswered ask_user card. The transcript skips
 * messages without any of these so answered interruptions never leave
 * empty avatar-only rows behind.
 */
export const hasVisibleParts = (
  parts: MessagePart[],
  answeredToolCallIds: Set<string>,
): boolean =>
  parts.some((part) => {
    if (isTextUIPart(part)) {
      return part.text.trim().length > 0;
    }

    if (isReasoningUIPart(part)) {
      return part.text.trim().length > 0;
    }

    if (isToolUIPart(part)) {
      return part.state === 'approval-requested';
    }

    if (isDataUIPart(part)) {
      const typed = part as {
        type: string;
        data?: { toolName?: string; toolCallId?: string };
      };

      return (
        typed.type === 'data-tool-call-suspended' &&
        typed.data?.toolName === 'askUser' &&
        !!typed.data.toolCallId &&
        !answeredToolCallIds.has(typed.data.toolCallId)
      );
    }

    return false;
  });

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
  answeredToolCallIds,
}: IMessagePartRendererProps) => {
  if (isTextUIPart(part)) {
    if (role === 'user') {
      return (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed md:text-[17px] md:leading-7">
          {part.text}
        </p>
      );
    }

    return <MessageContent content={part.text} />;
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

  // Data parts: the ask_user suspension carries the questions the assistant
  // asked; approval suspensions' metadata is already surfaced by the tool
  // part above. Everything else stays hidden. An answered suspension's data
  // part stays in the message, so the card is dropped once its tool call is
  // resolved.
  if (isDataUIPart(part)) {
    const group = readAskUserQuestions(part);

    if (!group) {
      return null;
    }

    const typed = part as { data?: { toolCallId?: string } };

    if (
      typed.data?.toolCallId &&
      answeredToolCallIds.has(typed.data.toolCallId)
    ) {
      return null;
    }

    return (
      <AskUserPrompt group={group} busy={answerBusy} onAnswer={onAnswer} />
    );
  }

  return null;
};
