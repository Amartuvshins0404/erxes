import { IconArrowUp, IconPlayerStop } from '@tabler/icons-react';
import { Button } from 'erxes-ui';
import { useState, type KeyboardEvent, type ReactNode } from 'react';

import { ChatInput } from './ChatInput';

export interface IComposerProps {
  status: string;
  disabled: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  /** Model / thinking pickers rendered in the composer toolbar row. */
  pickers?: ReactNode;
}

/**
 * Message composer: one card holding the auto-growing input, the per-turn
 * pickers and the send control.
 */
export const Composer = ({
  status,
  disabled,
  onSend,
  onStop,
  pickers,
}: IComposerProps) => {
  const [text, setText] = useState('');

  const isStreaming = status === 'submitted' || status === 'streaming';
  const trimmed = text.trim();
  const canSend = !disabled && !isStreaming && trimmed.length > 0;

  const send = () => {
    if (!canSend) {
      return;
    }

    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="rounded-[22px] border bg-card shadow-sm transition-colors hover:border-foreground/20">
      <div className="px-4 pt-3">
        <ChatInput
          value={text}
          onChange={setText}
          onKeyDown={handleKeyDown}
          placeholder="Ask agents…"
          disabled={disabled}
          ariaLabel="Message"
        />
      </div>
      <div className="flex items-center gap-2 px-2.5 pb-2.5 pt-1.5">
        {pickers && (
          <div className="ml-auto flex min-w-0 items-center gap-2">
            {pickers}
          </div>
        )}
        {isStreaming ? (
          <Button
            variant="outline"
            size="icon"
            className={`size-8 shrink-0 rounded-full ${pickers ? '' : 'ml-auto'}`}
            onClick={onStop}
            aria-label="Stop generating"
          >
            <IconPlayerStop className="size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className={`size-8 shrink-0 rounded-full ${pickers ? '' : 'ml-auto'}`}
            onClick={send}
            disabled={!canSend}
            aria-label="Send message"
          >
            <IconArrowUp className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
