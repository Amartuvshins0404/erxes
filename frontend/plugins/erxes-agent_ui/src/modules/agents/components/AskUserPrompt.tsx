import { IconCheck, IconMessageQuestion } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useState } from 'react';

import type { IAskUserAnswerEntry } from '../askUserAnswers';
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
      <div key={index} className={index > 0 ? 'ea:mt-4' : undefined}>
        <p className="ea:text-[15px] ea:font-medium ea:leading-relaxed ea:md:text-[17px]">
          {isSingle ? '' : `${index + 1}. `}
          {question.question}
        </p>

        {hasOptions && (
          <div className="ea:mt-2.5 ea:flex ea:flex-wrap ea:gap-2">
            {question.options!.map((option) => {
              const isActive = active(option.label);

              return (
                <button
                  key={option.label}
                  type="button"
                  disabled={busy}
                  title={option.description}
                  onClick={() => togglePick(index, option.label)}
                  className={`ea:rounded-full ea:border ea:px-3.5 ea:py-1.5 ea:text-[13px] ea:transition-colors ${
                    isActive
                      ? 'ea:border-primary ea:bg-primary/15 ea:font-medium ea:text-primary'
                      : 'ea:hover:border-primary/50 ea:hover:bg-primary/5'
                  } ${busy ? 'ea:cursor-not-allowed ea:opacity-60' : ''}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {isSingle && showInputs[0] && (
          <div className="ea:mt-2 ea:space-y-2">
            <div className="ea:rounded-lg ea:border ea:bg-card ea:px-3 ea:py-2">
              <ChatInput
                value={drafts[0]!}
                onChange={(text) => setDrafts([text])}
                placeholder="Type your answer…"
                disabled={busy}
                maxHeight={96}
                className="ea:text-xs ea:md:text-xs"
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
            className="ea:mt-2 ea:text-xs ea:text-muted-foreground ea:underline-offset-2 ea:transition-colors ea:hover:text-foreground ea:hover:underline ea:disabled:cursor-not-allowed ea:disabled:opacity-60"
          >
            None of these — type my own answer
          </button>
        )}

        {isSingle &&
          question.selectionMode === 'multi_select' &&
          picked[0]!.length > 0 && (
            <div className="ea:mt-2.5">
              <Button size="sm" disabled={busy} onClick={submitSingleMulti}>
                {`Send ${picked[0]!.length} choice${picked[0]!.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          )}
      </div>
    );
  };

  return (
    <div className="ea:my-1 ea:rounded-xl ea:border ea:bg-primary/5 ea:p-3 ea:text-foreground">
      <p className="ea:flex ea:items-center ea:gap-1.5 ea:text-sm ea:font-medium">
        <IconMessageQuestion className="ea:size-4 ea:shrink-0 ea:text-primary" />
        {isSingle ? 'Quick question' : `Quick questions (${questions.length})`}
      </p>

      {questions.map(renderQuestion)}

      {!isSingle && (
        <div className="ea:mt-4">
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

/**
 * Settled state of the same card: each question with the answer the user
 * gave, rendered from the askUser tool part so it survives reloads. The
 * answers themselves never appear as user bubbles.
 */
export const AskUserAnswered = ({ answers }: { answers: IAskUserAnswerEntry[] }) => (
  <div className="ea:my-1 ea:rounded-xl ea:border ea:bg-primary/5 ea:p-3 ea:text-foreground">
    <p className="ea:flex ea:items-center ea:gap-1.5 ea:text-sm ea:font-medium">
      <IconCheck className="ea:size-4 ea:shrink-0 ea:text-primary" />
      {answers.length === 1 ? 'Question answered' : 'Questions answered'}
    </p>

    {answers.map((entry, index) => (
      <div key={index} className={index > 0 ? 'ea:mt-3' : 'ea:mt-2'}>
        <p className="ea:text-[13px] ea:text-muted-foreground ea:md:text-sm">
          {entry.question}
        </p>
        <p className="ea:mt-0.5 ea:whitespace-pre-wrap ea:break-words ea:text-[15px] ea:font-medium ea:leading-relaxed ea:md:text-[17px]">
          {entry.answer}
        </p>
      </div>
    ))}
  </div>
);
