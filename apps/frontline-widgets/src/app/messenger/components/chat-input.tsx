import { FC, useEffect, useId, useRef, useState } from 'react';
import {
  IconArrowRight,
  IconMoodSmile,
  IconPaperclip,
  IconX,
} from '@tabler/icons-react';
import { Button, cn, Input, Popover } from 'erxes-ui';
import { EmojiPicker } from 'ui-modules/modules/automations/components/EmojiPicker';
import { useAtom } from 'jotai';
import { InitialMessage } from '../constants';
import { connectionAtom, widgetReplyToAtom } from '../states';
import { useCustomerData } from '../hooks/useCustomerData';
import { useChatInput } from '../hooks/useChatInput';
import { PersistentMenu } from './persistent-menu';
import { useMessenger } from '../hooks/useMessenger';
import { useAttachmentUploads } from '../hooks/useAttachmentUploads';
import { ChatAttachmentStrip } from './attachments/chat-input-strip';

type ChatInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const ChatInput: FC<ChatInputProps> = ({ className, ...inputProps }) => {
  const [connection] = useAtom(connectionAtom);
  const [replyTo, setReplyTo] = useAtom(widgetReplyToAtom);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const { activeTab, switchToTab } = useMessenger();
  const { messengerData } = connection.widgetsMessengerConnect || {};
  const { messages, isOnline, requireAuth } = messengerData || {};
  const defaultPlaceholder = isOnline
    ? InitialMessage.WELCOME
    : messages?.away || InitialMessage.AWAY;
  const placeholder = activeTab === 'chat' ? 'Reply...' : defaultPlaceholder;
  const id = useId();
  const {
    message,
    setMessage,
    handleInputChange,
    handleSubmit,
    isDisabled,
    loading,
  } = useChatInput();
  const { hasEmailOrPhone } = useCustomerData();
  const {
    attachments,
    pendingFiles,
    isUploading,
    handleFileChange,
    removeAttachment,
    dismissPendingFile,
    clearAttachments,
  } = useAttachmentUploads();
  const shouldDisable = requireAuth === true && !hasEmailOrPhone;
  const isChat = activeTab === 'chat';

  useEffect(() => {
    if (replyTo) messageInputRef.current?.focus();
  }, [replyTo]);

  const handleDisabledClick = () => {
    if (shouldDisable) switchToTab('messages');
  };

  const canSend = (!isDisabled || attachments.length > 0) && !isUploading;
  return (
    <div className="flex flex-col grow-0 shrink-0">
      {isChat && (
        <ChatAttachmentStrip
          attachments={attachments}
          pendingFiles={pendingFiles}
          isUploading={isUploading}
          onRemove={removeAttachment}
          onDismiss={dismissPendingFile}
        />
      )}

      {replyTo && (
        <div className="mx-2 mt-2 flex items-center justify-between gap-2 rounded-2xl bg-muted px-3 py-1.5 text-xs text-muted-foreground">
          <div className="min-w-0">
            <span className="font-medium text-foreground">
              Replying to {replyTo.authorName}:{' '}
            </span>
            <span className="truncate">{replyTo.content}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 shrink-0 rounded-full"
            onClick={() => setReplyTo(null)}
            aria-label="Cancel reply"
          >
            <IconX className="size-3" />
          </Button>
        </div>
      )}

      <form
        className="p-2 flex"
        onSubmit={(e) =>
          handleSubmit(e, {
            attachments,
            replyTo,
            onClear: () => {
              clearAttachments();
              setReplyTo(null);
            },
          })
        }
        autoComplete="off"
      >
        <div className="relative flex items-center gap-1.5 w-full rounded-full bg-card shadow-card p-1.5 ps-3 transition-shadow focus-within:shadow-focus">
          {shouldDisable && (
            <div
              className="absolute inset-0 z-10 rounded-full cursor-pointer"
              onClick={handleDisabledClick}
              aria-label="Sign in to send a message"
            />
          )}
          {isChat && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-full text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={shouldDisable}
                aria-label="Attach files"
              >
                <IconPaperclip />
              </Button>
            </>
          )}
          <Input
            ref={messageInputRef}
            id={id}
            className={cn(
              'h-8 flex-1 bg-transparent px-1 shadow-none focus-visible:shadow-none',
              className,
            )}
            placeholder={
              shouldDisable ? 'Sign in to send a message' : placeholder
            }
            value={message}
            disabled={shouldDisable}
            onChange={handleInputChange}
            {...inputProps}
          />
          {isChat && (
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <Popover.Trigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-full text-muted-foreground hover:text-primary"
                  disabled={shouldDisable}
                  aria-label="Choose emoji"
                >
                  <IconMoodSmile />
                </Button>
              </Popover.Trigger>
              <Popover.Content
                className="p-0 w-auto overflow-hidden rounded-2xl"
                align="end"
                side="top"
              >
                <EmojiPicker
                  className="max-h-80 w-72 shadow-none border-0 rounded-none"
                  onEmojiSelect={({ emoji }) => {
                    setMessage(message + emoji);
                    setEmojiOpen(false);
                  }}
                >
                  <EmojiPicker.Search className="text-foreground" />
                  <EmojiPicker.Content className="hide-scroll styled-scroll" />
                  <EmojiPicker.Footer className="text-foreground" />
                </EmojiPicker>
              </Popover.Content>
            </Popover>
          )}
          <Button
            size="icon"
            type="submit"
            aria-label="Send"
            variant="secondary"
            className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!canSend || loading || shouldDisable}
          >
            <IconArrowRight />
          </Button>
          <PersistentMenu />
        </div>
      </form>
    </div>
  );
};
