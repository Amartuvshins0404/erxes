import { useCallback, useRef } from 'react';
import {
  ComposerPrimitive,
  useComposer,
  useComposerRuntime,
} from '@assistant-ui/react';
import {
  IconArrowUp,
  IconLoader2,
  IconPlus,
} from '@tabler/icons-react';
import { Tooltip } from 'erxes-ui';
import type { ReasoningEffort } from '~/modules/chat/types';
import type { useAttachments } from '~/modules/chat/hooks/useAttachments';
import { ComposerAttachmentChip } from '~/modules/chat/components/ComposerAttachmentChip';
import { ReasoningEffortControl } from '~/modules/chat/components/ReasoningEffortControl';

type AttachmentsBag = ReturnType<typeof useAttachments>;

const quietBtn =
  'ea-quiet-btn flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40';

// The composer in the ChatGPT-clone style: rounded-[28px] surface, attachment
// chips on top, quiet circular controls, and a single high-contrast primary
// action (black square-stop while running, arrow-up send otherwise). assistant-
// ui primitives own the input (autosize, focus); the erxes send pipeline owns
// the actual send (staged uploads + body extras).
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
  const isEmpty = useComposer((s) => s.isEmpty);
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
    <div className="px-4 pb-3 pt-1">
      <div className="mx-auto w-full max-w-3xl">
        <ComposerPrimitive.Root
          data-agent-composer
          className="ea-composer flex w-full flex-col border bg-white px-2 py-2 transition-colors"
        >
          {pendingAtts.length > 0 && (
            <div className="flex flex-row flex-wrap gap-2 px-1 pt-1 pb-2">
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
          <div className="flex items-end gap-1">
            {attachmentsEnabled && (
              <Tooltip.Provider>
                <Tooltip>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      aria-label="Add photos & files"
                      className={quietBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={chatLoading || pendingAtts.length >= 10}
                    >
                      <IconPlus className="size-5" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    Attach files (images, PDF, Excel, Word, …)
                  </Tooltip.Content>
                </Tooltip>
              </Tooltip.Provider>
            )}
            <ComposerPrimitive.Input
              autoFocus
              submitOnEnter={false}
              cancelOnEscape={false}
              addAttachmentOnPaste={false}
              onKeyDown={handleKeyDown}
              onPaste={onPaste}
              placeholder={`Message ${agentName}…`}
              rows={1}
              className="ea-composer-input max-h-52 min-h-9 flex-1 resize-none bg-transparent py-1.5 pr-2 pl-1 text-base outline-none"
            />
            <div className="flex shrink-0 items-center gap-1">
              <ReasoningEffortControl
                value={reasoningEffort}
                onChange={onReasoningEffortChange}
                disabled={chatLoading}
              />
              {chatLoading ? (
                <Tooltip.Provider>
                  <Tooltip>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        aria-label="Stop generating (Esc)"
                        className="ea-send-btn flex size-9 items-center justify-center rounded-full"
                        onClick={onStop}
                      >
                        <div className="ea-stop-square size-2.5" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Content>Stop generating (Esc)</Tooltip.Content>
                  </Tooltip>
                </Tooltip.Provider>
              ) : (
                <button
                  type="button"
                  aria-label="Send message"
                  className="ea-send-btn flex size-9 items-center justify-center rounded-full transition-opacity disabled:opacity-30"
                  onClick={() => void send()}
                  disabled={isEmpty || uploadsInFlight}
                >
                  {uploadsInFlight ? (
                    <IconLoader2 className="size-5 animate-spin" />
                  ) : (
                    <IconArrowUp className="size-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </ComposerPrimitive.Root>
        <p className="pt-1.5 text-center text-xs text-muted-foreground">
          Enter to send · Shift+Enter for new line · Esc to stop
          {attachmentsEnabled && ' · drop or paste files to attach'}
        </p>
      </div>
    </div>
  );
};
