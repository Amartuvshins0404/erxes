import { useContext, useMemo, useState } from 'react';
import {
  useMessage,
  useThread,
  type ToolCallMessagePartProps,
} from '@assistant-ui/react';
import {
  IconCheck,
  IconCornerDownLeft,
  IconPencil,
  IconQuestionMark,
} from '@tabler/icons-react';
import { Button, Checkbox, Input, RadioGroup } from 'erxes-ui';
import {
  asAskUserQuestion,
  isAwaitingUserAnswer,
  parseAskUserAnswer,
  type AskUserQuestion,
} from '~/modules/chat/types';
import { ChatMessageActionsContext } from '~/modules/chat/assistant/chatContexts';
import { QuietLine } from '~/modules/chat/assistant/QuietTools';

// ask_user — the agent's structured clarifying question. The inline tool row
// stays a quiet status line (it may land inside a collapsed tool group); the
// interactive card renders once per message, after the parts (AskUserCard).

export const AskUserToolNote = ({
  result,
  status,
}: ToolCallMessagePartProps) => {
  const running = status?.type === 'running' || result === undefined;
  return (
    <QuietLine
      icon={IconQuestionMark}
      runningState="listening"
      running={running}
      label={running ? 'Preparing a question…' : 'Asked a question'}
    />
  );
};

// ── The card ────────────────────────────────────────────────────────────────

const messageText = (content: readonly { type: string; text?: string }[]) =>
  content
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');

interface AskUserRowProps {
  option: { label: string; description?: string };
  index: number;
  selected: boolean;
  control: React.ReactNode;
}

// One option row — number chip, label (+ optional description), and the
// corner-arrow affordance on the active pick, matching the reference design.
// The row is a <label> whose sr-only radio/checkbox covers it via ::after (the
// ChoiceboxGroup hit-area pattern); visual state comes from React state, not
// peer selectors (the host CSS purge strips plugin-only variants).
const AskUserRow = ({ option, index, selected, control }: AskUserRowProps) => (
  <label className={`ea-ask-option${selected ? ' ea-ask-option-on' : ''}`}>
    {control}
    <span className="ea-ask-num">{index + 1}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm leading-5">{option.label}</span>
      {option.description && (
        <span className="block text-xs leading-5 text-muted-foreground">
          {option.description}
        </span>
      )}
    </span>
    {selected && (
      <IconCornerDownLeft className="size-4 shrink-0 self-center text-primary" />
    )}
  </label>
);

// Interactive state. `multi` switches rows between radio (single) and checkbox
// (multi) semantics; "Something else" is the free-text escape that overrides
// the pick.
const AskUserForm = ({
  question,
  onSubmit,
  onSkip,
}: {
  question: AskUserQuestion;
  onSubmit: (answer: string) => void;
  onSkip: () => void;
}) => {
  const multi = question.selectionMode === 'multi_select';
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState('');

  const customActive = custom.trim().length > 0;
  const canSubmit = multi
    ? selected.length > 0 || customActive
    : customActive || selected.length === 1;

  const toggle = (label: string) =>
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label],
    );

  const submit = () => {
    if (!canSubmit) return;
    const answer = multi
      ? [...selected, ...(customActive ? [custom.trim()] : [])].join(', ')
      : customActive
      ? custom.trim()
      : selected[0];
    onSubmit(answer);
  };

  return (
    <div className="ea-pop ea-ask-card">
      <p className="text-sm font-medium leading-6">{question.question}</p>

      {question.options.length > 0 &&
        (multi ? (
          <div className="mt-1 flex flex-col">
            {question.options.map((option, i) => (
              <AskUserRow
                key={option.label}
                option={option}
                index={i}
                selected={selected.includes(option.label)}
                control={
                  <Checkbox
                    checked={selected.includes(option.label)}
                    onCheckedChange={() => toggle(option.label)}
                    className="sr-only after:absolute after:inset-0"
                  />
                }
              />
            ))}
          </div>
        ) : (
          <RadioGroup
            value={selected[0] ?? ''}
            onValueChange={(value) => {
              setSelected([value]);
              setCustom('');
            }}
            className="mt-1 flex flex-col gap-0"
          >
            {question.options.map((option, i) => (
              <AskUserRow
                key={option.label}
                option={option}
                index={i}
                selected={selected.includes(option.label) && !customActive}
                control={
                  <RadioGroup.Item
                    value={option.label}
                    className="sr-only after:absolute after:inset-0"
                  />
                }
              />
            ))}
          </RadioGroup>
        ))}

      {/* Free-text escape — always available (and the only input when the
          question came without options). Typing overrides the option pick. */}
      <div className="ea-ask-option">
        <IconPencil className="size-4 shrink-0 self-center text-muted-foreground" />
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Something else"
          className="h-8 flex-1 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip
        </Button>
        <Button size="sm" onClick={submit} disabled={!canSubmit}>
          Send
        </Button>
      </div>
    </div>
  );
};

// Settled state: the question plus what the user answered (parsed back from
// the hidden reply convention), or a plain "answered" receipt.
const AskUserSettled = ({
  question,
  answerText,
}: {
  question: AskUserQuestion;
  answerText: string | null;
}) => {
  const skipped = answerText?.startsWith('(skipped');
  const chosen = new Set(
    answerText && !skipped ? answerText.split(', ').map((s) => s.trim()) : [],
  );
  return (
    <div className="ea-ask-card ea-ask-card-done">
      <p className="text-sm font-medium leading-6 text-muted-foreground">
        {question.question}
      </p>
      {question.options.length > 0 && (
        <div className="mt-1 flex flex-col">
          {question.options.map((option, i) => {
            const hit = chosen.has(option.label);
            return (
              <div
                key={option.label}
                className="ea-ask-option ea-ask-option-done"
              >
                <span className="ea-ask-num">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-5">
                    {option.label}
                  </span>
                </span>
                {hit && (
                  <IconCheck className="size-4 shrink-0 self-center text-primary" />
                )}
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        {skipped
          ? 'Skipped'
          : answerText
          ? `Answered: ${answerText}`
          : 'Answered'}
      </p>
    </div>
  );
};

// One card per assistant message: the LAST ask_user call in it. Interactive
// only while the message is the newest and the turn is settled; otherwise it
// renders the answered receipt.
export const AskUserCard = () => {
  const actions = useContext(ChatMessageActionsContext);
  const messageId = useMessage((s) => s.id);
  const tool = useMessage((s) => {
    let found: { args: unknown; result?: unknown } | undefined;
    for (const part of s.content) {
      if (
        part.type === 'tool-call' &&
        (part as { toolName?: string }).toolName === 'ask_user'
      ) {
        found = part as unknown as { args: unknown; result?: unknown };
      }
    }
    return found;
  });
  const isRunning = useThread((s) => s.isRunning);
  const messages = useThread((s) => s.messages);

  const question = useMemo(
    () => (tool ? asAskUserQuestion(tool.args) : null),
    [tool],
  );

  if (!tool || !question || !isAwaitingUserAnswer(tool.result)) return null;

  const myIndex = messages.findIndex((m) => m.id === messageId);
  const pending = myIndex === messages.length - 1 && !isRunning;

  if (pending) {
    return (
      <AskUserForm
        question={question}
        onSubmit={(answer) =>
          actions.onAnswerQuestion(question.question, answer)
        }
        onSkip={() => actions.onSkipQuestion(question.question)}
      />
    );
  }

  // Read the receipt back from the first following user message that matches
  // the answer convention (the hidden reply is persisted, so this survives
  // reloads).
  let answerText: string | null = null;
  for (const m of messages.slice(myIndex + 1)) {
    if (m.role !== 'user') continue;
    const parsed = parseAskUserAnswer(messageText(m.content));
    if (parsed) {
      answerText = parsed;
      break;
    }
  }

  return <AskUserSettled question={question} answerText={answerText} />;
};
