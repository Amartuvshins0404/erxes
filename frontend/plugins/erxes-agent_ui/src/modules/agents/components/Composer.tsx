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
    <div className="ea:rounded-[22px] ea:border ea:bg-card ea:shadow-sm ea:transition-colors ea:hover:border-foreground/20">
      <div className="ea:px-3.5 ea:pt-3 ea:sm:px-4">
        <ChatInput
          value={text}
          onChange={setText}
          onKeyDown={handleKeyDown}
          placeholder="Ask agents…"
          disabled={disabled}
          ariaLabel="Message"
        />
      </div>
      {/* One row at every width: the pickers shrink (and truncate) instead of
          pushing the send control out of the card on a phone. */}
      <div className="ea:flex ea:items-center ea:gap-2 ea:px-2.5 ea:pb-2.5 ea:pt-1.5">
        {pickers && (
          <div className="ea:flex ea:min-w-0 ea:flex-1 ea:items-center ea:gap-2">
            {pickers}
          </div>
        )}
        {isStreaming ? (
          <Button
            variant="outline"
            size="icon"
            className={`ea:size-8 ea:shrink-0 ea:rounded-full ${pickers ? '' : 'ea:ml-auto'}`}
            onClick={onStop}
            aria-label="Stop generating"
          >
            <IconPlayerStop className="ea:size-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            className={`ea:size-8 ea:shrink-0 ea:rounded-full ${pickers ? '' : 'ea:ml-auto'}`}
            onClick={send}
            disabled={!canSend}
            aria-label="Send message"
          >
            <IconArrowUp className="ea:size-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
