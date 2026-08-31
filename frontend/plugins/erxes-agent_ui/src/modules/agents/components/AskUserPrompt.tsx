import { IconMessageQuestion } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useState } from 'react';

import { ChatInput } from './ChatInput';

export interface IAskUserQuestionEntry {
  question: string;
  options?: { label: string; description?: string }[];
  selectionMode?: 'single_select' | 'multi_select';
}

export interface IAskUserQuestionGroup {
  questions: IAskUserQuestionEntry[];
}

export interface IAskUserPromptProps {
  group: IAskUserQuestionGroup;
  busy: boolean;
  onAnswer: (answer: string | string[] | (string | string[])[]) => void;
}

/**
 * Inline card for the questions the assistant asked with the ask_user tool.
 * The run is suspended server-side; answering resumes it with the collected
 * answers. A single-question card keeps the snappy legacy interaction —
 * picking a single-select chip answers immediately — while a batched
 * multi-question card collects one answer per question behind a single
 * send button (the resume carries them positionally).
 */
export const AskUserPrompt = ({
  group,
  busy,
  onAnswer,
}: IAskUserPromptProps) => {
  const { questions } = group;
  const isSingle = questions.length === 1;

  const [picked, setPicked] = useState<string[][]>(() =>
    questions.map(() => []),
  );
  const [drafts, setDrafts] = useState<string[]>(() =>
    questions.map(() => ''),
  );
  const [showInputs, setShowInputs] = useState<boolean[]>(() =>
    questions.map((question) => !question.options?.length),
  );

  const answeredCount = questions.reduce((count, _question, index) => {
    const hasAnswer =
      picked[index]!.length > 0 || drafts[index]!.trim().length > 0;

    return count + (hasAnswer ? 1 : 0);
  }, 0);

  const allAnswered = answeredCount === questions.length;

  const togglePick = (index: number, label: string) => {
    if (busy) {
      return;
    }

    const question = questions[index]!;
    const isMulti = question.selectionMode === 'multi_select';

    // A lone single-select chip answers immediately, like the legacy card.
    if (isSingle && !isMulti) {
      onAnswer(label);
      return;
    }

    setPicked((current) =>
      current.map((selection, i) => {
        if (i !== index) {
          return selection;
        }

        if (!isMulti) {
          return [label];
        }

        return selection.includes(label)
          ? selection.filter((item) => item !== label)
          : [...selection, label];
      }),
    );
  };

  const submitSingleMulti = () => {
    if (picked[0]!.length > 0) {
      onAnswer(picked[0]!);
    }
  };

  const submitSingleText = () => {
    const text = drafts[0]!.trim();

    if (text) {
      onAnswer(text);
    }
  };

  const submitAll = () => {
    if (!allAnswered || busy) {
      return;
    }

    onAnswer(
      questions.map((question, index) => {
        if (question.options?.length) {
          return picked[index]!.length === 1 ? picked[index]![0]! : picked[index]!;
        }

        return drafts[index]!.trim();
      }),
    );
  };

  const renderQuestion = (question: IAskUserQuestionEntry, index: number) => {
    const active = (label: string) => picked[index]!.includes(label);
    const hasOptions = !!question.options?.length;

    return (
      <div key={index} className={index > 0 ? 'mt-4' : undefined}>
        <p className="text-[15px] font-medium leading-relaxed md:text-[17px]">
          {isSingle ? '' : `${index + 1}. `}
          {question.question}
        </p>

        {hasOptions && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {question.options!.map((option) => {
              const isActive = active(option.label);

              return (
                <button
                  key={option.label}
                  type="button"
                  disabled={busy}
                  title={option.description}
                  onClick={() => togglePick(index, option.label)}
                  className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                    isActive
                      ? 'border-primary bg-primary/15 font-medium text-primary'
                      : 'hover:border-primary/50 hover:bg-primary/5'
                  } ${busy ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {isSingle && showInputs[0] && (
          <div className="mt-2 space-y-2">
            <div className="rounded-lg border bg-card px-3 py-2">
              <ChatInput
                value={drafts[0]!}
                onChange={(text) => setDrafts([text])}
                placeholder="Type your answer…"
                disabled={busy}
                maxHeight={96}
                className="text-xs md:text-xs"
                ariaLabel="Your answer"
              />
            </div>
            <Button
              size="sm"
              disabled={busy || !drafts[0]!.trim()}
              onClick={submitSingleText}
            >
              Send
            </Button>
          </div>
        )}

        {isSingle && hasOptions && !showInputs[0] && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowInputs([true])}
            className="mt-2 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            None of these — type my own answer
          </button>
        )}

        {isSingle &&
          question.selectionMode === 'multi_select' &&
          picked[0]!.length > 0 && (
            <div className="mt-2.5">
              <Button size="sm" disabled={busy} onClick={submitSingleMulti}>
                {`Send ${picked[0]!.length} choice${picked[0]!.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="my-1 rounded-xl border bg-primary/5 p-3 text-foreground">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <IconMessageQuestion className="size-4 shrink-0 text-primary" />
        {isSingle ? 'Quick question' : `Quick questions (${questions.length})`}
      </p>

      {questions.map(renderQuestion)}

      {!isSingle && (
        <div className="mt-4">
          <Button size="sm" disabled={busy || !allAnswered} onClick={submitAll}>
            {allAnswered
              ? `Send ${questions.length} answers`
              : `Answered ${answeredCount}/${questions.length}`}
          </Button>
        </div>
      )}
    </div>
  );
};
