import { IconMessageQuestion } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useState } from 'react';

import { BloubBot } from './BloubBot';
import { ChatInput } from './ChatInput';

export interface IAskUserQuestion {
  question: string;
  options?: { label: string; description?: string }[];
  selectionMode?: 'single_select' | 'multi_select';
}

export interface IAskUserPromptProps {
  question: IAskUserQuestion;
  busy: boolean;
  onAnswer: (answer: string | string[]) => void;
}

/**
 * Inline card for a question the assistant asked with the ask_user tool.
 * The run is suspended server-side; answering resumes it with exactly the
 * picked option (single select) or every picked option (multi select) or the
 * typed text (free-form). Deliberately mirrors ApprovalPrompt's layout so
 * both interruptions read as one family.
 */
export const AskUserPrompt = ({
  question,
  busy,
  onAnswer,
}: IAskUserPromptProps) => {
  const isMulti = question.selectionMode === 'multi_select';
  const [draft, setDraft] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [showInput, setShowInput] = useState(!question.options?.length);

  const togglePick = (label: string) => {
    if (busy) {
      return;
    }

    if (!isMulti) {
      onAnswer(label);
      return;
    }

    setPicked((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const submitMulti = () => {
    if (picked.length > 0) {
      onAnswer(picked);
    }
  };

  const submitText = () => {
    const text = draft.trim();

    if (text) {
      onAnswer(text);
    }
  };

  return (
    <div className="my-1 rounded-xl border bg-primary/5 p-3 text-foreground">
      <div className="flex items-start gap-2">
        {/* The bot leans in with wide eyes while it waits for the answer. */}
        <BloubBot size={32} state="wide" className="-mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <IconMessageQuestion className="size-4 shrink-0 text-primary" />
            Quick question
          </p>
          <p className="mt-1 text-[15px] leading-relaxed md:text-[17px] md:leading-7">
            {question.question}
          </p>

          {question.options?.length ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {question.options.map((option) => {
                const active = picked.includes(option.label);

                return (
                  <button
                    key={option.label}
                    type="button"
                    disabled={busy}
                    title={option.description}
                    onClick={() => togglePick(option.label)}
                    className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                      active
                        ? 'border-primary bg-primary/15 font-medium text-primary'
                        : 'hover:border-primary/50 hover:bg-primary/5'
                    } ${busy ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {isMulti && (
            <div className="mt-2.5">
              <Button
                size="sm"
                disabled={busy || picked.length === 0}
                onClick={submitMulti}
              >
                {picked.length > 0
                  ? `Send ${picked.length} choice${picked.length > 1 ? 's' : ''}`
                  : 'Pick one or more'}
              </Button>
            </div>
          )}

          {showInput ? (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border bg-card px-3 py-2">
                <ChatInput
                  value={draft}
                  onChange={setDraft}
                  placeholder="Type your answer…"
                  disabled={busy}
                  maxHeight={96}
                  className="text-xs md:text-xs"
                  ariaLabel="Your answer"
                />
              </div>
              <Button
                size="sm"
                disabled={busy || !draft.trim()}
                onClick={submitText}
              >
                Send
              </Button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowInput(true)}
              className="mt-2 text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              None of these — type my own answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
