import { useCallback, useRef } from 'react';
import { ComposerPrimitive, useComposerRuntime } from '@assistant-ui/react';
import {
  IconLoader2,
  IconPaperclip,
  IconPlayerStopFilled,
  IconSend,
} from '@tabler/icons-react';
import { Button, Tooltip } from 'erxes-ui';
import type { ReasoningEffort } from '~/modules/chat/types';
import type { useAttachments } from '~/modules/chat/hooks/useAttachments';
import { ComposerAttachmentChip } from '~/modules/chat/components/ComposerAttachmentChip';
import { ReasoningEffortControl } from '~/modules/chat/components/ReasoningEffortControl';

type AttachmentsBag = ReturnType<typeof useAttachments>;

// The composer: assistant-ui primitives for the input (autosize, focus
// management) wrapped around the erxes send pipeline (staged attachment
// uploads + per-send body extras). Text state lives in the runtime composer;
// the actual send reads it and goes through the page's handler.
export const AgentComposer = ({
  onSend,
  onStop,
  chatLoading,
  attachmentsEnabled,
  attachments,
  agentName,
  reasoningEffort,
  onReasoningEffortChange,
}: {
  onSend: (message: string) => Promise<void>;
  onStop: () => void;
  chatLoading: boolean;
  attachmentsEnabled: boolean;
  attachments: AttachmentsBag;
  agentName: string;
  reasoningEffort?: ReasoningEffort;
  onReasoningEffortChange: (effort?: ReasoningEffort) => void;
}) => {
  const composerRuntime = useComposerRuntime();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { pendingAtts, addFiles, removeAttachment, uploadsInFlight, onPaste } =
    attachments;

  const send = useCallback(async () => {
    const text = composerRuntime.getState().text.trim();
    if (!text || uploadsInFlight) return;
    await onSend(text);
    composerRuntime.setText('');
  }, [composerRuntime, onSend, uploadsInFlight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
    if (e.key === 'Escape' && chatLoading) {
      e.preventDefault();
      onStop();
    }
  };

  return (
    <div className="px-3 pb-3 pt-1 bg-background">
      <div className="max-w-3xl mx-auto w-full">
        <ComposerPrimitive.Root
          data-agent-composer
          className={`ea-composer rounded-3xl border bg-background shadow-sm transition-all duration-200 focus-within:border-primary/50 focus-within:shadow-md ${
            chatLoading ? 'border-primary/30' : 'border-border'
          }`}
        >
          {pendingAtts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3.5 pt-3">
              {pendingAtts.map((att) => (
                <ComposerAttachmentChip
                  key={att.id}
                  att={att}
                  onRemove={() => removeAttachment(att.id)}
                />
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            aria-label="Attach files"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="px-3.5 pt-3">
            <ComposerPrimitive.Input
              submitOnEnter={false}
              cancelOnEscape={false}
              addAttachmentOnPaste={false}
              onKeyDown={handleKeyDown}
              onPaste={onPaste}
              placeholder={`Message ${agentName}…`}
              rows={1}
              className="ea-composer-textarea w-full min-h-6 max-h-44 resize-none bg-transparent text-sm leading-relaxed focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1 px-2 pb-2 pt-1">
            {attachmentsEnabled && (
              <Tooltip.Provider>
                <Tooltip>
                  <Tooltip.Trigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-9 shrink-0 rounded-full text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={chatLoading || pendingAtts.length >= 10}
                    >
                      <IconPaperclip className="size-4" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    Attach files (images, PDF, Excel, Word, …)
                  </Tooltip.Content>
                </Tooltip>
              </Tooltip.Provider>
            )}
            <ReasoningEffortControl
              value={reasoningEffort}
              onChange={onReasoningEffortChange}
              disabled={chatLoading}
            />
            <span className="flex-1" />
            {chatLoading ? (
              <Tooltip.Provider>
                <Tooltip>
                  <Tooltip.Trigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-9 shrink-0 rounded-full border-primary/40 text-primary hover:bg-primary/8 transition-all"
                      onClick={onStop}
                    >
                      <IconPlayerStopFilled className="size-4" />
                    </Button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Stop generating (Esc)</Tooltip.Content>
                </Tooltip>
              </Tooltip.Provider>
            ) : (
              <Button
                size="icon"
                aria-label="Send message"
                className="size-9 shrink-0 rounded-full transition-transform duration-150 hover:scale-105 active:scale-95 disabled:scale-100"
                onClick={() => void send()}
                disabled={uploadsInFlight}
              >
                {uploadsInFlight ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconSend className="size-4" />
                )}
              </Button>
            )}
          </div>
        </ComposerPrimitive.Root>
        <p className="text-[11px] text-muted-foreground mt-1.5 pl-1 text-center">
          Enter to send · Shift+Enter for new line · Esc to stop
          {attachmentsEnabled && ' · drop or paste files to attach'}
        </p>
      </div>
    </div>
  );
};
