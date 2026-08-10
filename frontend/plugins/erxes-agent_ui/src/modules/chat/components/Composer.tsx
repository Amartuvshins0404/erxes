import { memo, RefObject } from 'react';
import {
  IconLoader2,
  IconPaperclip,
  IconPlayerStopFilled,
  IconSend,
} from '@tabler/icons-react';
import { Button, Textarea, Tooltip } from 'erxes-ui';
import { ReasoningEffort } from '~/modules/chat/types';
import { useAttachments } from '~/modules/chat/hooks/useAttachments';
import { ComposerAttachmentChip } from '~/modules/chat/components/ComposerAttachmentChip';
import { ReasoningEffortControl } from '~/modules/chat/components/ReasoningEffortControl';
import { VoiceModeToggle } from '~/modules/chat/voice/components/VoiceModeToggle';

type AttachmentsBag = ReturnType<typeof useAttachments>;

export const Composer = memo(({
  input,
  onInputChange,
  onSend,
  onStop,
  onKeyDown,
  chatLoading,
  attachmentsEnabled,
  attachments,
  agentName,
  reasoningEffort,
  onReasoningEffortChange,
  voiceEnabled,
  voiceMode,
  onVoiceModeToggle,
  onVoiceSetup,
  textareaRef,
  fileInputRef,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  chatLoading: boolean;
  attachmentsEnabled: boolean;
  attachments: AttachmentsBag;
  agentName: string;
  reasoningEffort?: ReasoningEffort;
  onReasoningEffortChange: (effort?: ReasoningEffort) => void;
  voiceEnabled: boolean;
  voiceMode: boolean;
  onVoiceModeToggle: () => void;
  onVoiceSetup: () => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  fileInputRef: RefObject<HTMLInputElement>;
}) => {
  const { pendingAtts, addFiles, removeAttachment, uploadsInFlight, onPaste } =
    attachments;
  return (
  <div className="px-3 pb-3 pt-1 bg-background">
    <div className="max-w-3xl mx-auto w-full">
      {/* Claude-style composer: the message fills the top, the controls sit in a
          quiet row beneath it (tools left, send right). */}
      <div
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
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              onInputChange(e.target.value)
            }
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={`Message ${agentName}…`}
            rows={1}
            className="ea-composer-textarea w-full min-h-6 max-h-44 resize-none bg-transparent text-sm leading-relaxed"
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
          <VoiceModeToggle
            configured={voiceEnabled}
            active={voiceMode}
            onToggle={onVoiceModeToggle}
            onConfigure={onVoiceSetup}
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
              onClick={onSend}
              disabled={!input.trim() || uploadsInFlight}
            >
              {uploadsInFlight ? (
                <IconLoader2 className="size-4 animate-spin" />
              ) : (
                <IconSend className="size-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5 pl-1 text-center">
        Enter to send · Shift+Enter for new line · Esc to stop
        {attachmentsEnabled && ' · drop or paste files to attach'}
      </p>
    </div>
  </div>
  );
});
Composer.displayName = 'Composer';
